package com.cafepos.service;

import com.cafepos.dto.TableDto;
import com.cafepos.dto.TableRequest;
import com.cafepos.entity.Floor;
import com.cafepos.entity.RestaurantTable;
import com.cafepos.repository.FloorRepository;
import com.cafepos.repository.RestaurantTableRepository;
import com.cafepos.websocket.TableWebSocketHandler;
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
    private final TableWebSocketHandler tableWebSocketHandler;

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

    public TableDto getTableById(Long id) {
        RestaurantTable table = tableRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Table not found: " + id));
        return TableDto.from(table);
    }

    @Transactional
    public TableDto createTable(TableRequest request) {
        Floor floor = floorRepository.findByName(request.getFloorName())
            .orElseGet(() -> {
                Floor newFloor = new Floor();
                newFloor.setName(request.getFloorName());
                return floorRepository.save(newFloor);
            });
        RestaurantTable table = new RestaurantTable();
        table.setFloor(floor);
        table.setTableNumber(request.getTableNumber());
        table.setSeats(request.getSeats());
        table.setActive(true);
        TableDto dto = TableDto.from(tableRepository.save(table));
        tableWebSocketHandler.broadcastUpdate(dto);
        return dto;
    }

    @Transactional
    public TableDto updateTable(Long id, TableRequest request) {
        RestaurantTable table = tableRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Table not found: " + id));
        if (request.getTableNumber() != null) table.setTableNumber(request.getTableNumber());
        if (request.getSeats() != null) table.setSeats(request.getSeats());
        if (request.getFloorName() != null && !request.getFloorName().isBlank()) {
            Floor floor = floorRepository.findByName(request.getFloorName())
                .orElseGet(() -> {
                    Floor newFloor = new Floor();
                    newFloor.setName(request.getFloorName());
                    return floorRepository.save(newFloor);
                });
            table.setFloor(floor);
        }
        if (request.getStatus() != null) table.setStatus(request.getStatus());
        if (request.getOccupiedMembers() != null) {
            table.setOccupiedMembers(request.getOccupiedMembers());
        } else if ("AVAILABLE".equals(request.getStatus())) {
            table.setOccupiedMembers(0); // auto-reset
        }

        TableDto dto = TableDto.from(tableRepository.save(table));
        tableWebSocketHandler.broadcastUpdate(dto);
        return dto;
    }

    @Transactional
    public void deleteTable(Long id) {
        RestaurantTable table = tableRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Table not found: " + id));
        table.setActive(false);
        tableRepository.save(table);
        
        // Broadcast delete action
        tableWebSocketHandler.broadcastUpdate(java.util.Map.of("deletedTableId", id));
    }
}
