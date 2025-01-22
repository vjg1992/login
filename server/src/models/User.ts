// src/models/User.ts
export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
    age?: number;
    created_at: Date;
    updated_at: Date;
    last_login?: Date;
    is_email_verified: boolean;
    is_mobile_verified: boolean;
    is_google_auth: boolean;
    google_id?: string;
}