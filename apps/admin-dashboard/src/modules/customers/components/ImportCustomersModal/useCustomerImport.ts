/**
 * Custom Hook: useCustomerImport
 *
 * Encapsulates all business logic for customer CSV import:
 * - Encryption key initialization
 * - CSV file processing with PII sanitization
 * - Database batch insert operations
 * - Audit logging for MMCP compliance
 */

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import {
  initializeEncryptionKey,
  processCustomerCSV,
  getSuccessfulRecords,
  type CustomerImportResult,
} from '../../../../utils/customerImport';
import { supabase } from '../../../../services/supabase/client';
import { useCurrentUser } from '../../../../hooks/useAuth';
import type {
  ImportStep,
  ImportProgress,
  DbInsertResult,
  UseCustomerImportReturn,
} from './types';

interface UseCustomerImportOptions {
  dispensaryId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Hook managing the complete customer import workflow
 */
export function useCustomerImport({
  dispensaryId,
  isOpen,
  onClose,
}: UseCustomerImportOptions): UseCustomerImportReturn {
  const [step, setStep] = useState<ImportStep>('upload');
  const [importResult, setImportResult] = useState<CustomerImportResult | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress>({ current: 0, total: 0 });
  const [encryptionKeyReady, setEncryptionKeyReady] = useState(false);
  const [dbInsertResult, setDbInsertResult] = useState<DbInsertResult | null>(null);

  const toast = useToast();
  const user = useCurrentUser();

  // Initialize encryption key when modal opens
  useEffect(() => {
    async function initKey() {
      try {
        // In production, this key should come from secure storage/env
        // For now, we'll use a session-based key
        const key = sessionStorage.getItem('pii_encryption_key');
        await initializeEncryptionKey(key || undefined);
        if (!key) {
          // Store the generated key for this session
          const newKey = await initializeEncryptionKey();
          sessionStorage.setItem('pii_encryption_key', newKey);
        }
        setEncryptionKeyReady(true);
      } catch (error) {
        console.error('Failed to initialize encryption:', error);
        toast({
          title: 'Encryption Error',
          description: 'Failed to initialize encryption. Please refresh and try again.',
          status: 'error',
          duration: 5000,
        });
      }
    }
    if (isOpen) {
      initKey();
    }
  }, [isOpen, toast]);

  /**
   * Handle file drop from dropzone
   */
  const handleFileDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (!encryptionKeyReady) {
        toast({
          title: 'Not Ready',
          description: 'Encryption is still initializing. Please wait.',
          status: 'warning',
          duration: 3000,
        });
        return;
      }

      try {
        toast({
          title: 'Processing CSV...',
          description: 'Parsing and sanitizing customer data',
          status: 'info',
          duration: 2000,
        });

        const result = await processCustomerCSV(
          file,
          file.name,
          (current, total) => setImportProgress({ current, total })
        );

        setImportResult(result);
        setStep('preview');

        toast({
          title: 'Processing Complete',
          description: `${result.successful} customers ready for import`,
          status: 'success',
          duration: 3000,
        });
      } catch (error) {
        console.error('CSV processing error:', error);
        toast({
          title: 'Processing Failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          duration: 5000,
        });
      }
    },
    [encryptionKeyReady, toast]
  );

  /**
   * Execute the database import operation
   */
  const handleImport = useCallback(async () => {
    if (!importResult) return;

    setStep('importing');
    setImportProgress({ current: 0, total: importResult.successful });

    const records = getSuccessfulRecords(importResult);
    const batchSize = 50;
    let inserted = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      // Insert in batches
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        // Transform to database format
        const dbRecords = batch.map((r) => ({
          dispensary_id: dispensaryId,
          email_hash: r.email_hash,
          phone_hash: r.phone_hash,
          license_number_hash: r.license_number_hash,
          medical_card_hash: r.medical_card_hash,
          first_name_encrypted: r.first_name_encrypted,
          last_name_encrypted: r.last_name_encrypted,
          date_of_birth_encrypted: r.date_of_birth_encrypted,
          physical_address_encrypted: r.physical_address_encrypted,
          is_medical_patient: r.is_medical_patient,
          medical_card_expiration: r.medical_card_expiration,
          enable_loyalty: r.enable_loyalty,
          loyalty_points: Math.floor(r.loyalty_balance),
          total_purchases: r.year_to_date,
          customer_tier: r.loyalty_balance > 100 ? 'gold' : r.loyalty_balance > 50 ? 'silver' : 'standard',
          import_source: r.import_source,
          import_warnings: r.import_warnings,
        }));

        const { data, error } = await supabase
          .from('customers')
          .upsert(dbRecords, {
            onConflict: 'dispensary_id,license_number_hash',
            ignoreDuplicates: false,
          })
          .select('id');

        if (error) {
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
          failed += batch.length;
        } else {
          inserted += data?.length || batch.length;
        }

        setImportProgress({ current: i + batch.length, total: records.length });
      }

      // Log the import action for MMCP audit compliance
      if (user) {
        await supabase.rpc('log_customer_access', {
          p_dispensary_id: dispensaryId,
          p_user_id: user.id,
          p_user_email: user.email,
          p_user_role: user.role,
          p_access_type: 'import_data',
          p_customer_count: inserted,
          p_reason: `CSV import from ${importResult.rows[0]?.original?.customer_code || 'Vend'}`,
        });
      }

      setDbInsertResult({ inserted, failed, errors });
      setStep('complete');

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${inserted} customers`,
        status: failed > 0 ? 'warning' : 'success',
        duration: 5000,
      });
    } catch (error) {
      console.error('Database insert error:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
      setStep('preview');
    }
  }, [importResult, dispensaryId, user, toast]);

  /**
   * Reset state and close modal
   */
  const handleClose = useCallback(() => {
    setStep('upload');
    setImportResult(null);
    setDbInsertResult(null);
    setImportProgress({ current: 0, total: 0 });
    onClose();
  }, [onClose]);

  return {
    // State
    step,
    importResult,
    importProgress,
    encryptionKeyReady,
    dbInsertResult,
    // Actions
    setStep,
    handleFileDrop,
    handleImport,
    handleClose,
  };
}
