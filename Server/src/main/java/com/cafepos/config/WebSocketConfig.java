package com.cafepos.config;

import com.cafepos.websocket.KdsWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final KdsWebSocketHandler kdsWebSocketHandler;

    public WebSocketConfig(KdsWebSocketHandler kdsWebSocketHandler) {
        this.kdsWebSocketHandler = kdsWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(kdsWebSocketHandler, "/ws/kds").setAllowedOrigins("*");
    }
}
