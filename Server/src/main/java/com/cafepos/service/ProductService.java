package com.cafepos.service;

import com.cafepos.entity.Category;
import com.cafepos.entity.Product;
import com.cafepos.repository.CategoryRepository;
import com.cafepos.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> searchProducts(String name) {
        return productRepository.findByNameContainingIgnoreCase(name);
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public Product createProduct(Product product) {
        if (product.getCategory() != null && product.getCategory().getId() != null) {
            Category category = categoryRepository.findById(product.getCategory().getId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            product.setCategory(category);
        }
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product productDetails) {
        return productRepository.findById(id)
                .map(product -> {
                    product.setName(productDetails.getName());
                    product.setPrice(productDetails.getPrice());
                    product.setUnitOfMeasure(productDetails.getUnitOfMeasure());
                    product.setTaxPercent(productDetails.getTaxPercent());
                    product.setDescription(productDetails.getDescription());
                    product.setActive(productDetails.isActive());
                    product.setShowOnKds(productDetails.isShowOnKds());

                    if (productDetails.getCategory() != null && productDetails.getCategory().getId() != null) {
                        Category category = categoryRepository.findById(productDetails.getCategory().getId())
                                .orElseThrow(() -> new RuntimeException("Category not found"));
                        product.setCategory(category);
                    }

                    return productRepository.save(product);
                })
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
}
