package com.cafepos.config;

import com.cafepos.websocket.KdsWebSocketHandler;
import com.cafepos.websocket.TableWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final KdsWebSocketHandler kdsWebSocketHandler;
    private final TableWebSocketHandler tableWebSocketHandler;

    public WebSocketConfig(KdsWebSocketHandler kdsWebSocketHandler, TableWebSocketHandler tableWebSocketHandler) {
        this.kdsWebSocketHandler = kdsWebSocketHandler;
        this.tableWebSocketHandler = tableWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(kdsWebSocketHandler, "/ws/kds").setAllowedOrigins("*");
        registry.addHandler(tableWebSocketHandler, "/ws/tables").setAllowedOrigins("*");
    }
}
