package com.cafepos.service;

import com.cafepos.dto.TableDto;
import com.cafepos.dto.TableRequest;
import com.cafepos.entity.Floor;
import com.cafepos.entity.RestaurantTable;
import com.cafepos.repository.FloorRepository;
import com.cafepos.repository.RestaurantTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TableService {

    private final RestaurantTableRepository tableRepository;
    private final FloorRepository floorRepository;

    public List<TableDto> getAllActiveTables() {
        return tableRepository.findByActiveTrue().stream()
            .map(TableDto::from)
            .collect(Collectors.toList());
    }

    public List<TableDto> getAllTables() {
        return tableRepository.findAll().stream()
            .map(TableDto::from)
            .collect(Collectors.toList());
    }

    @Transactional
    public TableDto createTable(TableRequest request) {
        Floor floor = floorRepository.findById(request.getFloorId())
            .orElseThrow(() -> new RuntimeException("Floor not found: " + request.getFloorId()));
        RestaurantTable table = new RestaurantTable();
        table.setFloor(floor);
        table.setTableNumber(request.getTableNumber());
        table.setSeats(request.getSeats());
        table.setActive(true);
        return TableDto.from(tableRepository.save(table));
    }

    @Transactional
    public TableDto updateTable(Long id, TableRequest request) {
        RestaurantTable table = tableRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Table not found: " + id));
        if (request.getTableNumber() != null) table.setTableNumber(request.getTableNumber());
        if (request.getSeats() != null) table.setSeats(request.getSeats());
        if (request.getFloorId() != null) {
            Floor floor = floorRepository.findById(request.getFloorId())
                .orElseThrow(() -> new RuntimeException("Floor not found"));
            table.setFloor(floor);
        }
        return TableDto.from(tableRepository.save(table));
    }

    @Transactional
    public void deleteTable(Long id) {
        RestaurantTable table = tableRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Table not found: " + id));
        table.setActive(false);
        tableRepository.save(table);
    }
}
