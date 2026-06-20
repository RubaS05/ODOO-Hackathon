package com.cafepos.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendWelcomeEmail(String toEmail, String name) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Welcome to Odoo Cafe POS!");
            message.setText("Hello " + name + ",\n\n" +
                    "Welcome to Odoo Cafe POS! Your account has been successfully created.\n\n" +
                    "Best regards,\n" +
                    "Odoo Cafe POS Team");
            
            mailSender.send(message);
            log.info("Welcome email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}", toEmail, e);
        }
    }

    @Async
    public void sendReceiptEmail(String toEmail, String customerName, String orderNumber, String htmlReceipt) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Your Receipt from Odoo Cafe - " + orderNumber);

            // Send the beautiful HTML receipt directly as the email body
            helper.setText(htmlReceipt, true);

            mailSender.send(message);
            log.info("HTML Receipt email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send receipt email to {}", toEmail, e);
        }
    }
}
