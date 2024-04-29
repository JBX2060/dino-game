
#pragma once

#include <stdint.h>

#ifndef EMSCRIPTEN
struct lws_context;
struct lws;
#else
#endif
struct rr_game;

extern uint8_t RR_OUTGOING_PACKET[1024 * 16];

enum rr_websocket_event_type
{
    rr_websocket_event_type_open,
    rr_websocket_event_type_close,
    rr_websocket_event_type_data
};

struct rr_websocket
{
    uint8_t recieved_first_packet;
    void *user_data;
#ifndef EMSCRIPTEN
    struct lws_context *socket_context;
    struct lws *socket;
#endif
    uint64_t clientbound_encryption_key;
    uint64_t serverbound_encryption_key;
};

void rr_websocket_init(struct rr_websocket *);
void rr_websocket_connect_to(struct rr_websocket *, char const *);
void rr_websocket_disconnect(struct rr_websocket *, struct rr_game *);
void rr_websocket_send(struct rr_websocket *, uint32_t);
void rr_websocket_queue_send(struct rr_websocket *, uint32_t);

void rr_websocket_send_all(struct rr_websocket *);