import {User} from '../modules/users/user.entity';
import {Session,AuthToken,OAuthAttempt} from '../modules/auth/auth.entity';
import {UserLessonProgress} from '../modules/learning/learning.entity';
import {quizEntities} from '../modules/quiz/quiz.entity';
import {InitialAuth1760000000000} from './1760000000000-InitialAuth';
import {LearningProgress1792886400000} from './1792886400000-LearningProgress';
import {QuizAssessment1792900800000} from './1792900800000-QuizAssessment';
import {QuestionFeedback1792915200000} from './1792915200000-QuestionFeedback';
import {SharedRateLimits1793000000000} from './1793000000000-SharedRateLimits';
import {QuestionReport} from '../modules/quiz/feedback.entity';

// No environment or connection side effects: application and isolated tests use exactly this schema.
export const appEntities=[User,Session,AuthToken,OAuthAttempt,UserLessonProgress,...quizEntities,QuestionReport];
export const appMigrations=[InitialAuth1760000000000,LearningProgress1792886400000,QuizAssessment1792900800000,QuestionFeedback1792915200000,SharedRateLimits1793000000000];
