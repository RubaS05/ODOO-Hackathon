package com.cafepos.service;

import com.cafepos.entity.PaymentMethod;
import com.cafepos.repository.PaymentMethodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PaymentMethodService {

    private final PaymentMethodRepository paymentMethodRepository;

    public List<PaymentMethod> getAllPaymentMethods() {
        return paymentMethodRepository.findAll();
    }

    public Optional<PaymentMethod> getPaymentMethodById(Long id) {
        return paymentMethodRepository.findById(id);
    }

    public PaymentMethod updatePaymentMethod(Long id, PaymentMethod details) {
        return paymentMethodRepository.findById(id)
                .map(method -> {
                    method.setEnabled(details.isEnabled());
                    if (details.getUpiId() != null) {
                        method.setUpiId(details.getUpiId());
                    }
                    return paymentMethodRepository.save(method);
                })
                .orElseThrow(() -> new RuntimeException("Payment Method not found with id: " + id));
    }
}
