export interface User {
	id: number;
	name: string;
	email: string;
	phone_number: string;
	is_active: boolean;
	created_at: string;
}

export interface Admin {
	id: number;
	name: string;
	email: string;
	is_active: boolean;
}

export interface Video {
	id: number;
	youtube_video_id: string;
	title: string;
	description: string;
	is_active: boolean;
	created_by: number;
	created_at: string;
	updated_at: string;
}

export interface Question {
	id: number;
	user_id: number;
	video_id: number;
	number: number;
	text: string;
	created_at: string;
}

export interface QuestionEntry {
	id: number;
	user_name: string;
	email: string;
	phone: string;
	video_id: number;
	webinar_title: string;
	number: number;
	text: string;
	created_at: string;
}

export interface AttendanceEntry {
	id: number;
	user_name: string;
	email: string;
	phone: string;
	video_id: number;
	webinar_title: string;
	login_at: string;
	watched_seconds: number;
}

export interface LiveQuiz {
	id: number;
	question: string;
	kind: 'true_false' | 'multiple_choice';
	options: string[];
	answered: boolean;
	answer_index: number;
	correct: boolean;
}

export interface AdminQuizEntry {
	id: number;
	video_id: number;
	video_title: string;
	question: string;
	kind: 'true_false' | 'multiple_choice';
	options: string[];
	correct_index: number;
	is_published: boolean;
	answers_count: number;
}

export interface QuizAnswerEntry {
	name: string;
	email: string;
	answer_index: number;
	answer_text: string;
	correct: boolean;
	answered_at: string;
}

export interface Pagination {
	page: number;
	pages: number;
	total: number;
	limit: number;
	prev: number;
	next: number;
	has_prev: boolean;
	has_next: boolean;
}

export interface DashboardStats {
	total_users: number;
	active_user_sessions: number;
	total_videos: number;
}

export interface AuthMeResponse {
	authenticated: boolean;
	user?: User;
	site_enabled: boolean;
	message?: string;
	csrf_token: string;
}

export interface AdminAuthMeResponse {
	authenticated: boolean;
	admin?: Admin;
	csrf_token: string;
}

export interface VideoStateResponse {
	available: boolean;
	user: User;
	active_video: Video | null;
	questions: Question[];
	can_ask: boolean;
	watched_seconds: number;
	video_notice_seconds: number;
	base_url: string;
	csrf_token: string;
}
