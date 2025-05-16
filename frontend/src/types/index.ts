// 用户相关类型
export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  user_type: 'student' | 'teacher' | 'admin';
  avatar?: string;
  bio?: string;
  date_joined: string;
  student_profile?: StudentProfile;
  teacher_profile?: TeacherProfile;
}

export interface StudentProfile {
  student_id?: string;
}

export interface TeacherProfile {
  title?: string;
  department?: string;
}

// 认证相关类型
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  user_type: 'student' | 'teacher';
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

// 课程相关类型
export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  instructor: User;
  category: Category;
  cover_image?: string;
  video_url?: string;
  description: string;
  learning_objectives?: string;
  prerequisites?: string;
  status: 'draft' | 'published' | 'archived';
  price: number;
  is_free: boolean;
  created_at: string;
  updated_at: string;
  students_count: number;
  is_enrolled?: boolean;
  sections?: Section[];
  average_rating?: number;
  ratings_count?: number;
  user_rating?: CourseRating;
  comments?: Comment[];
}

export interface Section {
  id: number;
  course: number;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: number;
  section: number;
  title: string;
  lesson_type: 'video' | 'document' | 'quiz';
  content?: string;
  duration: number;
  order: number;
  is_free_preview: boolean;
}

export interface Enrollment {
  id: number;
  student: User;
  course: number;
  status: 'active' | 'completed' | 'expired';
  enrolled_at: string;
  completed_at?: string;
}

export interface LessonProgress {
  id: number;
  enrollment: number;
  lesson: number;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percent: number;
  last_position: number;
  last_accessed: string;
}

// 视频相关类型
export interface Video {
  id: number;
  lesson: Lesson;
  title: string;
  file: string;
  thumbnail?: string;
  duration: number;
  status: 'processing' | 'ready' | 'error';
  is_downloadable: boolean;
  upload_date: string;
}

export interface LiveStreaming {
  id: number;
  lesson: Lesson;
  title: string;
  description?: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  stream_url?: string;
}

export interface VideoWatchHistory {
  id: number;
  user: User;
  video: Video;
  watched_duration: number;
  last_position: number;
  completed: boolean;
  watch_date: string;
}

// 测验相关类型
export interface Quiz {
  id: number;
  lesson: Lesson;
  title: string;
  description?: string;
  time_limit: number;
  pass_score: number;
  allow_multiple_attempts: boolean;
  max_attempts: number;
  randomize_questions: boolean;
  show_correct_answers: boolean;
  created_at: string;
  updated_at: string;
  questions: Question[];
  user_attempts_count?: number;
  instructor?: User;
}

export interface Question {
  id: number;
  quiz?: number;
  question_text: string;
  question_type: string;
  points: number;
  explanation?: string;
  order?: number;
  choices?: Choice[];
  answers?: Answer[];
}

export interface Choice {
  id: number;
  question: number;
  choice_text: string;
  is_correct?: boolean;
}

export interface QuizAttempt {
  id: number;
  user: User;
  quiz: Quiz;
  start_time: string;
  end_time?: string;
  status: 'in_progress' | 'completed' | 'timed_out';
  score: number;
  passed: boolean;
  attempt_number: number;
  answers: Answer[];
}

export interface Answer {
  id: number;
  quiz_attempt: number;
  question: Question;
  selected_choices: Choice[];
  text_answer?: string;
  is_correct: boolean;
  score: number;
  feedback?: string;
}

// 评论相关类型
export interface Comment {
  id: number;
  user: User;
  content: string;
  content_type: string;
  object_id: number;
  parent?: number;
  is_public: boolean;
  is_removed: boolean;
  created_at: string;
  updated_at: string;
  reply_count: number;
  like_count: number;
  is_liked: boolean;
}

export interface Notification {
  id: number;
  recipient: User;
  sender?: User;
  notification_type: 'comment' | 'reply' | 'like' | 'course' | 'system';
  message: string;
  is_read: boolean;
  created_at: string;
}

// 评分相关类型
export interface CourseRating {
  id: number;
  user: User;
  course: number;
  score: number;
  created_at: string;
  updated_at: string;
}

// 直播相关类型
export interface LiveEvent {
  id: number;
  title: string;
  description: string;
  instructor: User;
  course: number;
  scheduled_start_time: string;
  scheduled_end_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  status: 'scheduled' | 'live' | 'ended' | 'canceled';
  stream_key?: string;
  rtmp_url?: string;
  play_url?: string;
  pre_recorded_video_url?: string;
  viewer_count: number;
  max_viewer_count: number;
  created_at: string;
  updated_at: string;
  enrollments_count: number;
  is_enrolled: boolean;
}

export interface LiveEnrollment {
  id: number;
  user: User;
  live_event: number;
  enrolled_at: string;
  attended: boolean;
}

export interface LiveChatMessage {
  id: number;
  live_event: number;
  user: User;
  message: string;
  created_at: string;
} 