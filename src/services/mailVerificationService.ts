import nodemailer from 'nodemailer'
import { CONFIG } from '../config/config'
import crypto from 'crypto'

export const sendVerificationEmail = async (
    email: string,
    token: string,
    firstName: string
): Promise<void> => {
    const transporter: nodemailer.Transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: CONFIG.EMAIL_USER,
            pass: CONFIG.EMAIL_PASSWORD
        }
    })

    token.trim()

    const verificationUrl: string = `http://localhost:3001/auth/verify-email?token=${token}`

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your email address',
        html: `
            <h1>Hello ${firstName}!</h1>
            <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
            <a href="${verificationUrl}">Verify Email</a>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create this account, please ignore this email.</p>
        `
    }

    await transporter.sendMail(mailOptions)
}

export const genVerificationToken = (
): {verificationToken: string, verificationTokenExpiry: string} => {
    const verificationToken: string = crypto.randomBytes(32).toString('hex').trim()
    const verificationTokenExpiry: string = new Date(
        Date.now() + 24 * 60 * 60 * 1000
    ).toISOString().trim()

    return { verificationToken, verificationTokenExpiry }
}