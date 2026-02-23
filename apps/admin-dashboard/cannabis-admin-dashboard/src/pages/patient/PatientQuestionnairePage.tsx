import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  Button,
  Progress,
  RadioGroup,
  Radio,
  Checkbox,
  CheckboxGroup,
  Textarea,
  Icon,
  Badge,
} from '@chakra-ui/react';
import { FiArrowLeft, FiArrowRight, FiCheck, FiHelpCircle } from 'react-icons/fi';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * PatientQuestionnairePage - Self-Service Questionnaire
 * Patients complete intake questionnaire on their own device
 */

interface QuestionOption {
  value: string;
  label: string;
  description: string;
}

interface Question {
  id: string;
  title: string;
  subtitle?: string;
  type: 'single_choice' | 'multiple_choice' | 'textarea';
  options?: QuestionOption[];
  required: boolean;
  placeholder?: string;
}

// Simplified questionnaire based on the Maine Medical template
const questions: Question[] = [
  {
    id: 'what_brings_you_in',
    title: 'What brings you in today?',
    subtitle: 'Help us understand your situation',
    type: 'textarea',
    required: false,
    placeholder: 'Tell us a bit about what you are looking for or what you are experiencing...',
  },
  {
    id: 'primary_need',
    title: 'What is your primary need?',
    subtitle: 'Select the main reason you are seeking medical cannabis',
    type: 'single_choice',
    required: true,
    options: [
      { value: 'pain', label: 'Pain Relief', description: 'Chronic pain, injury pain, or general discomfort' },
      { value: 'sleep', label: 'Sleep Issues', description: 'Insomnia, restless sleep, or difficulty staying asleep' },
      { value: 'anxiety', label: 'Anxiety & Stress', description: 'General anxiety, stress relief, or nervousness' },
      { value: 'appetite', label: 'Appetite Stimulation', description: 'Difficulty eating or maintaining appetite' },
      { value: 'nausea', label: 'Nausea Relief', description: 'Nausea from medication or other causes' },
      { value: 'other', label: 'Other', description: 'Something else or multiple concerns' },
    ],
  },
  {
    id: 'experience_level',
    title: 'How would you describe your tolerance?',
    subtitle: 'We will adjust THC recommendations accordingly',
    type: 'single_choice',
    required: true,
    options: [
      { value: 'first_time', label: 'First-Time User', description: 'I am brand new to cannabis' },
      { value: 'low_tolerance', label: 'Low Tolerance', description: 'Small amounts work well for me' },
      { value: 'regular_user', label: 'Regular User', description: 'I use regularly with moderate tolerance' },
      { value: 'high_tolerance', label: 'High Tolerance', description: 'I need higher potency products' },
    ],
  },
  {
    id: 'consumption_method',
    title: 'What is your preferred way to consume?',
    subtitle: 'Different methods have different onset times and durations',
    type: 'single_choice',
    required: true,
    options: [
      { value: 'flower', label: 'Flower (Smoking)', description: 'Traditional method, fast-acting (5-10 min onset)' },
      { value: 'vape', label: 'Vaporizer', description: 'Healthier than smoking, fast-acting (2-5 min onset)' },
      { value: 'edible', label: 'Edibles', description: 'Longer-lasting effects (30-90 min onset, 4-8 hr duration)' },
      { value: 'tincture', label: 'Tinctures', description: 'Sublingual drops, moderate onset (15-45 min)' },
      { value: 'topical', label: 'Topicals', description: 'Creams/balms for localized relief' },
    ],
  },
  {
    id: 'preferred_time',
    title: 'When do you plan to use this?',
    subtitle: 'We will recommend appropriate strain types for your schedule',
    type: 'single_choice',
    required: true,
    options: [
      { value: 'morning', label: 'Morning', description: 'Need to stay alert and functional' },
      { value: 'daytime', label: 'Daytime', description: 'Mid-day use while staying productive' },
      { value: 'evening', label: 'Evening', description: 'Winding down after work' },
      { value: 'night', label: 'Night / Bedtime', description: 'Before sleep or nighttime only' },
      { value: 'varies', label: 'It Varies', description: 'Different times depending on the day' },
    ],
  },
];

function PatientQuestionnairePage() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestion === questions.length - 1;
  const isFirstQuestion = currentQuestion === 0;

  const canProceed = () => {
    if (!question.required) return true;
    const answer = answers[question.id];
    if (Array.isArray(answer)) return answer.length > 0;
    return !!answer;
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Submit questionnaire
      console.log('Submitting answers:', answers);
      navigate('/patient/recommendations');
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstQuestion) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleAnswer = (value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: value,
    }));
  };

  return (
    <Box minH="100vh" bg="slate.900" py={8}>
      <Container maxW="container.md">
        <VStack align="stretch" spacing={6}>
          {/* Progress Header */}
          <VStack align="stretch" spacing={2}>
            <HStack justify="space-between">
              <Badge colorScheme="cannabis" fontSize="sm">
                Question {currentQuestion + 1} of {questions.length}
              </Badge>
              <Text color="slate.400" fontSize="sm">
                {Math.round(progress)}% complete
              </Text>
            </HStack>
            <Progress
              value={progress}
              size="sm"
              colorScheme="cannabis"
              bg="slate.700"
              borderRadius="full"
            />
          </VStack>

          {/* Question Card */}
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody p={8}>
              <VStack align="stretch" spacing={6}>
                {/* Question Title */}
                <VStack align="start" spacing={2}>
                  <Heading size="lg" color="white">
                    {question.title}
                  </Heading>
                  {question.subtitle && (
                    <Text color="slate.400">{question.subtitle}</Text>
                  )}
                </VStack>

                {/* Answer Options */}
                <Box>
                  {question.type === 'textarea' && (
                    <Textarea
                      placeholder={question.placeholder}
                      value={(answers[question.id] as string) || ''}
                      onChange={(e) => handleAnswer(e.target.value)}
                      bg="slate.900"
                      borderColor="slate.600"
                      _hover={{ borderColor: 'slate.500' }}
                      _focus={{ borderColor: 'cannabis.500', boxShadow: '0 0 0 1px var(--chakra-colors-cannabis-500)' }}
                      rows={5}
                      color="white"
                      _placeholder={{ color: 'slate.500' }}
                    />
                  )}

                  {question.type === 'single_choice' && question.options && (
                    <RadioGroup
                      value={(answers[question.id] as string) || ''}
                      onChange={(value) => handleAnswer(value)}
                    >
                      <VStack align="stretch" spacing={3}>
                        {question.options.map((option) => (
                          <Box
                            key={option.value}
                            p={4}
                            bg={answers[question.id] === option.value ? 'cannabis.900/30' : 'slate.900'}
                            borderRadius="lg"
                            border="2px solid"
                            borderColor={answers[question.id] === option.value ? 'cannabis.500' : 'slate.700'}
                            cursor="pointer"
                            onClick={() => handleAnswer(option.value)}
                            _hover={{ borderColor: answers[question.id] === option.value ? 'cannabis.500' : 'slate.600' }}
                            transition="all 0.2s"
                          >
                            <HStack justify="space-between">
                              <VStack align="start" spacing={1}>
                                <Text color="white" fontWeight="semibold">
                                  {option.label}
                                </Text>
                                <Text color="slate.400" fontSize="sm">
                                  {option.description}
                                </Text>
                              </VStack>
                              <Radio
                                value={option.value}
                                colorScheme="cannabis"
                                size="lg"
                              />
                            </HStack>
                          </Box>
                        ))}
                      </VStack>
                    </RadioGroup>
                  )}

                  {question.type === 'multiple_choice' && question.options && (
                    <CheckboxGroup
                      value={(answers[question.id] as string[]) || []}
                      onChange={(values) => handleAnswer(values as string[])}
                    >
                      <VStack align="stretch" spacing={3}>
                        {question.options.map((option) => {
                          const isSelected = ((answers[question.id] as string[]) || []).includes(option.value);
                          return (
                            <Box
                              key={option.value}
                              p={4}
                              bg={isSelected ? 'cannabis.900/30' : 'slate.900'}
                              borderRadius="lg"
                              border="2px solid"
                              borderColor={isSelected ? 'cannabis.500' : 'slate.700'}
                              cursor="pointer"
                              _hover={{ borderColor: isSelected ? 'cannabis.500' : 'slate.600' }}
                              transition="all 0.2s"
                            >
                              <HStack justify="space-between">
                                <VStack align="start" spacing={1}>
                                  <Text color="white" fontWeight="semibold">
                                    {option.label}
                                  </Text>
                                  <Text color="slate.400" fontSize="sm">
                                    {option.description}
                                  </Text>
                                </VStack>
                                <Checkbox
                                  value={option.value}
                                  colorScheme="cannabis"
                                  size="lg"
                                />
                              </HStack>
                            </Box>
                          );
                        })}
                      </VStack>
                    </CheckboxGroup>
                  )}
                </Box>

                {/* Navigation Buttons */}
                <HStack justify="space-between" pt={4}>
                  <Button
                    variant="ghost"
                    color="slate.400"
                    leftIcon={<Icon as={FiArrowLeft} />}
                    onClick={handleBack}
                    isDisabled={isFirstQuestion}
                  >
                    Back
                  </Button>
                  <Button
                    colorScheme="cannabis"
                    rightIcon={<Icon as={isLastQuestion ? FiCheck : FiArrowRight} />}
                    onClick={handleNext}
                    isDisabled={!canProceed()}
                  >
                    {isLastQuestion ? 'Get Recommendations' : 'Continue'}
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Help Text */}
          <HStack justify="center" spacing={2} color="slate.500">
            <Icon as={FiHelpCircle} />
            <Text fontSize="sm">Need help? Ask your budtender for assistance.</Text>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
}

export default PatientQuestionnairePage;
