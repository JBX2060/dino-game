
#include <Client/Renderer/ComponentRender.h>

#include <math.h>

#include <Client/Game.h>
#include <Client/Renderer/Renderer.h>
#include <Client/Simulation.h>

#include <Client/Assets/RenderFunctions.h>

void rr_component_petal_render(EntityIdx entity, struct rr_game *game,
                               struct rr_simulation *simulation)
{
    struct rr_renderer *renderer = game->renderer;
    struct rr_component_physical *physical =
        rr_simulation_get_physical(simulation, entity);
    struct rr_component_petal *petal =
        rr_simulation_get_petal(simulation, entity);
    struct rr_component_health *health =
        rr_simulation_get_health(simulation, entity);
    rr_renderer_set_global_alpha(renderer, 1 - physical->deletion_animation);
    rr_renderer_scale(renderer, 1 + physical->deletion_animation * 0.5);
    if (petal->id == rr_petal_id_uranium)
    {
        rr_renderer_set_fill(renderer, 0x2063bf2e);
        rr_renderer_begin_path(renderer);
        rr_renderer_arc(renderer, 0, 0,
                        30 + 5 * sinf(physical->animation_timer * 0.1));
        rr_renderer_fill(renderer);
    }
    /*if (petal->rarity == 7)
    {
        struct rr_simulation_animation *particle = rr_particle_alloc(
            &game->particle_manager, rr_animation_type_default);
        float angle =
            rr_vector_theta(&physical->lerp_velocity) - 0.5 + rr_frand();
        rr_vector_from_polar(&particle->velocity, 5 + rr_frand() * 3, angle);
        particle->x = physical->lerp_x;
        particle->y = physical->lerp_y;
        particle->size = 3 + rr_frand() * 2;
        particle->opacity = 0.3 + rr_frand() * 0.2;
        particle->color = 0xffffffff;
    }*/

    if (petal->rarity >= rr_rarity_id_exotic)
    {
        uint8_t exo = petal->rarity == rr_rarity_id_exotic;
        uint8_t count = exo ? 1 : 2;
        for (uint8_t i = 0; i < count; ++i)
        {
            struct rr_simulation_animation *particle = rr_particle_alloc(
                &game->particle_manager, rr_animation_type_default);
            float angle =
                rr_vector_theta(&physical->lerp_velocity) - 0.5 + rr_frand();
            rr_vector_from_polar(&particle->velocity,
                                 (5 + rr_frand() * 3) * (exo ? 0.5 : 1), angle);
            particle->x = physical->lerp_x;
            particle->y = physical->lerp_y;
            particle->size = (3 + rr_frand() * 2) * (exo ? 0.5 : 1);
            particle->opacity = (0.3 + rr_frand() * 0.2) * (exo ? 0.5 : 1);
            particle->color = 0xffffffff;
        }
    }
    if (game->cache.tint_petals)
        rr_renderer_add_color_filter(renderer, RR_RARITY_COLORS[petal->rarity],
                                     0.4);
    rr_renderer_add_color_filter(renderer, 0xffff0000,
                                 0.5 * health->damage_animation);
    rr_renderer_rotate(renderer, physical->lerp_angle);

    rr_renderer_scale(renderer, physical->radius / 10);
    uint8_t use_cache =
        (((health->damage_animation < 0.1) | game->cache.low_performance_mode) &
         1) &
        (1 - game->cache.tint_petals);
    if (petal->id != rr_petal_id_peas || petal->detached == 1)
        rr_renderer_draw_petal(renderer, petal->id, use_cache);
    else
        rr_renderer_draw_static_petal(renderer, petal->id, petal->rarity,
                                      use_cache);
}