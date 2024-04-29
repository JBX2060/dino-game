
#pragma once

#include <Shared/Component/Common.h>
#include <Shared/Entity.h>
#include <Shared/Utilities.h>

struct rr_simulation;
struct proto_bug;
RR_CLIENT_ONLY(struct rr_renderer;)
RR_SERVER_ONLY(struct rr_component_player_info;)

struct rr_component_relations
{
    EntityHash owner;
    RR_SERVER_ONLY(EntityHash root_owner;)
    EntityIdx parent_id;
    RR_SERVER_ONLY(uint8_t protocol_state;)
    uint8_t team;
};

void rr_component_relations_init(struct rr_component_relations *,
                                 struct rr_simulation *);
void rr_component_relations_free(struct rr_component_relations *,
                                 struct rr_simulation *);

RR_SERVER_ONLY(void rr_component_relations_update_root_owner(
                   struct rr_simulation *, struct rr_component_relations *);)

RR_SERVER_ONLY(void rr_component_relations_write(
                   struct rr_component_relations *, struct proto_bug *, int,
                   struct rr_component_player_info *);)
RR_CLIENT_ONLY(void rr_component_relations_read(struct rr_component_relations *,
                                                struct proto_bug *);)

RR_DECLARE_PUBLIC_FIELD(relations, EntityHash, owner)
RR_DECLARE_PUBLIC_FIELD(relations, uint32_t, team)