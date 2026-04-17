// ============================================
// Quiz & Assessment System v1.0
// Adaptive quizzes based on concepts
// ============================================

export class QuizSystem {
  constructor() {
    this.quizzes = new Map();
    this.userAnswers = new Map();
    this.scores = new Map();
    
    this.initializeQuizzes();
    console.log('❓ Quiz System initialized');
  }

  initializeQuizzes() {
    // Kinematics quiz
    this.quizzes.set('kinematics', {
      title: 'Motion & Kinematics',
      difficulty: 'intermediate',
      questions: [
        {
          id: 'k1',
          question: 'What is acceleration?',
          type: 'multiple_choice',
          options: [
            'Speed at any instant',
            'Rate of change of velocity',
            'Distance traveled',
            'Displacement per unit time'
          ],
          correct: 1,
          explanation: 'Acceleration is the rate of change of velocity over time. It tells us how quickly an object is speeding up or slowing down.'
        },
        {
          id: 'k2',
          question: 'If a car moves 100m in 5 seconds, what is its average speed?',
          type: 'numerical',
          correct: 20,
          tolerance: 0.5,
          unit: 'm/s',
          explanation: 'Average speed = distance / time = 100m / 5s = 20 m/s'
        },
        {
          id: 'k3',
          question: 'What is the SI unit of acceleration?',
          type: 'multiple_choice',
          options: ['m/s', 'm/s²', 'km/h', 'ft/s²'],
          correct: 1,
          explanation: 'The SI unit of acceleration is meters per second squared (m/s²)'
        }
      ]
    });

    // Atomic structure quiz
    this.quizzes.set('atomic', {
      title: 'Atomic Structure',
      difficulty: 'beginner',
      questions: [
        {
          id: 'a1',
          question: 'What is the nucleus of an atom composed of?',
          type: 'multiple_choice',
          options: [
            'Electrons only',
            'Protons and neutrons',
            'Photons',
            'Energy waves'
          ],
          correct: 1,
          explanation: 'The nucleus contains protons (positively charged) and neutrons (neutral). Electrons orbit around the nucleus.'
        },
        {
          id: 'a2',
          question: 'True or False: Electrons are larger than protons',
          type: 'true_false',
          correct: false,
          explanation: 'Electrons are much smaller than protons. A proton is about 1,836 times more massive than an electron.'
        },
        {
          id: 'a3',
          question: 'How many electrons does a neutral carbon atom have?',
          type: 'numerical',
          correct: 6,
          explanation: 'Carbon has atomic number 6, meaning it has 6 protons and 6 electrons in a neutral atom.'
        }
      ]
    });

    // DNA quiz
    this.quizzes.set('dna', {
      title: 'DNA & Genetics',
      difficulty: 'intermediate',
      questions: [
        {
          id: 'd1',
          question: 'What does DNA stand for?',
          type: 'multiple_choice',
          options: [
            'Dynamic Nuclear Acid',
            'Deoxyribonucleic Acid',
            'Digital Nucleotide Array',
            'Deoxyribose Nucleic Assembly'
          ],
          correct: 1,
          explanation: 'DNA stands for Deoxyribonucleic Acid. It is the molecule that carries genetic instructions for life.'
        },
        {
          id: 'd2',
          question: 'How many strands does a DNA double helix have?',
          type: 'numerical',
          correct: 2,
          explanation: 'DNA consists of two complementary strands wound together in a double helix structure, discovered by Watson and Crick.'
        },
        {
          id: 'd3',
          question: 'Which bases pair together in DNA?',
          type: 'matching',
          pairs: [
            { left: 'Adenine (A)', right: 'Thymine (T)' },
            { left: 'Guanine (G)', right: 'Cytosine (C)' }
          ],
          explanation: 'Adenine pairs with Thymine, and Guanine pairs with Cytosine. These are called Watson-Crick base pairs.'
        }
      ]
    });
  }

  // Get quiz for topic
  getQuiz(topic) {
    return this.quizzes.get(topic) || null;
  }

  // Check answer
  checkAnswer(quizTopic, questionId, userAnswer) {
    const quiz = this.quizzes.get(quizTopic);
    if (!quiz) return null;

    const question = quiz.questions.find(q => q.id === questionId);
    if (!question) return null;

    let isCorrect = false;
    let feedback = '';

    if (question.type === 'multiple_choice' || question.type === 'true_false') {
      isCorrect = userAnswer === question.correct;
      feedback = isCorrect ? '✅ Correct!' : '❌ Incorrect';
    } else if (question.type === 'numerical') {
      const difference = Math.abs(userAnswer - question.correct);
      const tolerance = question.tolerance || 0;
      isCorrect = difference <= tolerance;
      feedback = isCorrect ? '✅ Correct!' : `❌ Incorrect. Expected: ${question.correct}${question.unit || ''}`;
    }

    const result = {
      questionId,
      userAnswer,
      isCorrect,
      correctAnswer: question.correct,
      explanation: question.explanation,
      feedback
    };

    // Store answer
    const key = `${quizTopic}_${questionId}`;
    if (!this.userAnswers.has(quizTopic)) {
      this.userAnswers.set(quizTopic, []);
    }
    this.userAnswers.get(quizTopic).push(result);

    return result;
  }

  // Calculate quiz score
  calculateScore(quizTopic) {
    const answers = this.userAnswers.get(quizTopic) || [];
    const quiz = this.quizzes.get(quizTopic);
    
    if (!quiz || answers.length === 0) return 0;

    const correct = answers.filter(a => a.isCorrect).length;
    const score = Math.round((correct / quiz.questions.length) * 100);

    this.scores.set(quizTopic, {
      score,
      correct,
      total: quiz.questions.length,
      percentage: score,
      timestamp: Date.now(),
      difficulty: quiz.difficulty
    });

    return score;
  }

  // Get performance report
  getPerformanceReport(quizTopic) {
    const answers = this.userAnswers.get(quizTopic) || [];
    const score = this.scores.get(quizTopic);

    if (!score) return null;

    return {
      topic: quizTopic,
      score: score.score,
      percentage: score.percentage,
      correctAnswers: score.correct,
      totalQuestions: score.total,
      difficulty: score.difficulty,
      timestamp: new Date(score.timestamp).toLocaleString(),
      performance: this.getPerformanceLevel(score.percentage),
      recommendations: this.getRecommendations(score.percentage)
    };
  }

  // Get performance level
  getPerformanceLevel(percentage) {
    if (percentage >= 90) return { level: 'Excellent', emoji: '🌟' };
    if (percentage >= 80) return { level: 'Great', emoji: '⭐' };
    if (percentage >= 70) return { level: 'Good', emoji: '✅' };
    if (percentage >= 60) return { level: 'Fair', emoji: '⚠️' };
    return { level: 'Needs Improvement', emoji: '📚' };
  }

  // Get recommendations based on performance
  getRecommendations(percentage) {
    if (percentage >= 90) {
      return 'Excellent understanding! Try the next topic.';
    }
    if (percentage >= 80) {
      return 'Good job! Review the concepts you missed.';
    }
    if (percentage >= 70) {
      return 'Solid effort! Revisit the topic for better mastery.';
    }
    return 'Keep practicing! Rewatch the concept visualization and try again.';
  }

  // Get all quiz results
  getAllResults() {
    return Array.from(this.scores.entries()).map(([topic, score]) => ({
      topic,
      ...score
    }));
  }

  // Adaptive quiz difficulty
  getAdaptiveDifficulty(topic, userPerformance) {
    const baseQuiz = this.quizzes.get(topic);
    if (!baseQuiz) return null;

    if (userPerformance >= 90) {
      return 'expert';
    } else if (userPerformance >= 70) {
      return 'advanced';
    } else if (userPerformance >= 50) {
      return 'intermediate';
    }
    return 'beginner';
  }

  // Clear all quiz data
  clearAllQuizzes() {
    this.userAnswers.clear();
    this.scores.clear();
  }
}

export function createQuizSystem() {
  return new QuizSystem();
}
