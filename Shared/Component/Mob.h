
#pragma once

#include <Shared/Component/Common.h>
#include <Shared/Entity.h>
#include <Shared/Utilities.h>

struct rr_simulation;
struct proto_bug;
RR_CLIENT_ONLY(struct rr_renderer;)
RR_SERVER_ONLY(struct rr_component_player_info;)
RR_SERVER_ONLY(struct rr_maze_grid;)

struct rr_component_mob
{
    RR_SERVER_ONLY(struct rr_maze_grid *zone;)
    RR_SERVER_ONLY(float squad_damage_counter[RR_SQUAD_COUNT];)
    RR_SERVER_ONLY(uint16_t ticks_to_despawn;)
    RR_SERVER_ONLY(uint8_t force_despawn;)
    RR_SERVER_ONLY(uint16_t ticks_to_force_despawn;)
    EntityIdx parent_id;
    RR_SERVER_ONLY(uint8_t protocol_state;)
    uint8_t id;
    uint8_t rarity;
    uint8_t flags;
    RR_CLIENT_ONLY(uint8_t counted_as_killed;)
    RR_SERVER_ONLY(uint8_t player_spawned : 1;)
    RR_SERVER_ONLY(uint8_t no_drop : 1;)
};

void rr_component_mob_init(struct rr_component_mob *, struct rr_simulation *);
void rr_component_mob_free(struct rr_component_mob *, struct rr_simulation *);

RR_SERVER_ONLY(void rr_component_mob_write(struct rr_component_mob *,
                                           struct proto_bug *, int,
                                           struct rr_component_player_info *);)
RR_CLIENT_ONLY(void rr_component_mob_read(struct rr_component_mob *,
                                          struct proto_bug *);)

RR_DECLARE_PUBLIC_FIELD(mob, uint8_t, id)
RR_DECLARE_PUBLIC_FIELD(mob, uint8_t, rarity)
RR_DECLARE_PUBLIC_FIELD(mob, uint8_t, flags)
