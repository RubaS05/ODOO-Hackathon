package com.cafepos.service;

import com.cafepos.dto.OrderDto;
import com.cafepos.dto.OrderItemDto;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
public class ReceiptService {

    public String generateReceiptHtml(OrderDto order) {
        StringBuilder html = new StringBuilder();
        
        html.append("<html><head><style>")
            .append("body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; padding: 20px; }")
            .append(".receipt-container { max-width: 400px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }")
            .append(".header { text-align: center; border-bottom: 2px dashed #e4e4e7; padding-bottom: 20px; margin-bottom: 20px; }")
            .append(".header h1 { margin: 0; color: #18181b; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }")
            .append(".header p { margin: 5px 0 0; color: #71717a; font-size: 14px; }")
            .append(".info { margin-bottom: 20px; font-size: 14px; color: #3f3f46; }")
            .append(".info p { margin: 4px 0; }")
            .append(".items { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }")
            .append(".items th { text-align: left; padding-bottom: 8px; border-bottom: 1px solid #e4e4e7; color: #71717a; font-weight: 600; }")
            .append(".items td { padding: 8px 0; border-bottom: 1px solid #f4f4f5; color: #3f3f46; }")
            .append(".items .qty { text-align: center; }")
            .append(".items .amount { text-align: right; }")
            .append(".totals { width: 100%; font-size: 14px; color: #3f3f46; margin-bottom: 20px; }")
            .append(".totals td { padding: 4px 0; }")
            .append(".totals .label { text-align: right; padding-right: 15px; }")
            .append(".totals .value { text-align: right; font-weight: 600; }")
            .append(".totals .discount { color: #10b981; }")
            .append(".totals .grand-total .label, .totals .grand-total .value { font-size: 18px; font-weight: 800; color: #18181b; padding-top: 10px; border-top: 2px solid #e4e4e7; }")
            .append(".footer { text-align: center; color: #71717a; font-size: 14px; margin-top: 30px; }")
            .append(".footer p { margin: 5px 0; }")
            .append("</style></head><body>")
            .append("<div class='receipt-container'>")
            
            // Header
            .append("<div class='header'>")
            .append("<h1>ODOO CAFE POS</h1>")
            .append("<p>Order Receipt</p>")
            .append("</div>")
            
            // Info
            .append("<div class='info'>")
            .append("<p><strong>Order Number:</strong> ").append(order.getOrderNumber()).append("</p>")
            .append("<p><strong>Date:</strong> ").append(order.getOrderDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))).append("</p>")
            .append("<p><strong>Service Type:</strong> ").append(order.getOrderType().toUpperCase()).append("</p>");
            
        if (order.getCustomerName() != null) {
            html.append("<p><strong>Customer:</strong> ").append(order.getCustomerName()).append("</p>");
        }
        
        html.append("</div>")
            
            // Items Table
            .append("<table class='items'>")
            .append("<tr><th>Item</th><th class='qty'>Qty</th><th class='amount'>Price</th><th class='amount'>Total</th></tr>");
            
        for (OrderItemDto item : order.getItems()) {
            html.append("<tr>")
                .append("<td>").append(item.getProductName() != null ? item.getProductName() : "Item").append("</td>")
                .append("<td class='qty'>").append(item.getQuantity()).append("</td>")
                .append("<td class='amount'>₹").append(String.format("%.2f", item.getUnitPrice())).append("</td>")
                .append("<td class='amount'>₹").append(String.format("%.2f", item.getLineTotal())).append("</td>")
                .append("</tr>");
        }
        
        html.append("</table>")
            
            // Totals
            .append("<table class='totals'>")
            .append("<tr><td class='label'>Subtotal</td><td class='value'>₹").append(String.format("%.2f", order.getSubtotal())).append("</td></tr>")
            .append("<tr><td class='label'>Tax</td><td class='value'>₹").append(String.format("%.2f", order.getTaxAmount())).append("</td></tr>");
            
        if (order.getDiscountAmount() != null && order.getDiscountAmount().signum() > 0) {
            html.append("<tr class='discount'><td class='label'>Discount</td><td class='value'>-₹").append(String.format("%.2f", order.getDiscountAmount())).append("</td></tr>");
        }
        
        html.append("<tr class='grand-total'><td class='label'>TOTAL PAID</td><td class='value'>₹").append(String.format("%.2f", order.getTotalAmount())).append("</td></tr>")
            .append("</table>")
            
            // Footer
            .append("<div class='footer'>")
            .append("<p><strong>Thank you for dining with us!</strong></p>")
            .append("<p>We hope to see you again soon.</p>")
            .append("</div>")
            
            .append("</div></body></html>");

        return html.toString();
    }
}
