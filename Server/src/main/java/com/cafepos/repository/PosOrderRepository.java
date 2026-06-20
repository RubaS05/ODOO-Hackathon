package com.cafepos.repository;

import com.cafepos.entity.PosOrder;
import com.cafepos.entity.PosSession;
import com.cafepos.enums.KitchenStatus;
import com.cafepos.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import java.util.Optional;

public interface PosOrderRepository extends JpaRepository<PosOrder, Long> {
    List<PosOrder> findBySessionOrderByOrderDateDesc(PosSession session);
    List<PosOrder> findByKitchenStatusInOrderByOrderDateAsc(List<KitchenStatus> statuses);
    List<PosOrder> findByStatusNotOrderByOrderDateDesc(OrderStatus status);
    List<PosOrder> findAllByOrderByOrderDateDesc();

    List<PosOrder> findByTableIdOrderByOrderDateDesc(Long tableId);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM PosOrder o WHERE o.session = :session AND o.status = 'PAID'")
    java.math.BigDecimal sumTotalBySession(PosSession session);
}
