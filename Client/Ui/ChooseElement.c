
#include <Client/Ui/Ui.h>

#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <Client/Game.h>
#include <Client/Renderer/Renderer.h>

static void choose_element_on_render(struct rr_ui_element *this,
                                     struct rr_game *game)
{
    struct rr_ui_choose_element_metadata *data = this->data;
    uint8_t to_show = data->choose(this, game);
    rr_ui_render_element(this->elements.start[to_show], game);
    if (to_show != data->previously_shown)
    {
        if (data->not_first_frame)
            this->elements.start[data->previously_shown]->on_hide(
                this->elements.start[data->previously_shown], game);
        else
        {
            for (uint8_t i = 0; i < this->elements.size; ++i)
            {
                if (i == to_show)
                    continue;
                this->elements.start[i]->on_hide(this->elements.start[i], game);
            }
            data->not_first_frame = 1;
        }
        data->previously_shown = to_show;
    }
}

static void choose_element_poll_events(struct rr_ui_element *this,
                                       struct rr_game *game)
{
    struct rr_ui_choose_element_metadata *data = this->data;
    struct rr_ui_element *show = this->elements.start[data->previously_shown];
    rr_ui_element_check_if_focused(this, game);
    if (!show->prevent_on_event)
        show->poll_events(show, game);
}

static void choose_element_on_hide(struct rr_ui_element *this,
                                   struct rr_game *game)
{
    for (uint32_t i = 0; i < this->elements.size; ++i)
        this->elements.start[i]->on_hide(this->elements.start[i], game);
}

struct rr_ui_element *rr_ui_choose_element_init(
    struct rr_ui_element *a, struct rr_ui_element *b,
    uint8_t (*choose)(struct rr_ui_element *, struct rr_game *))
{
    struct rr_ui_element *this = rr_ui_element_init();
    struct rr_ui_choose_element_metadata *data = malloc(sizeof *data);
    data->choose = choose;
    this->data = data;
    this->resizeable = rr_ui_choose_container;
    rr_ui_container_add_element(this, b);
    rr_ui_container_add_element(this, a);
    this->on_render = choose_element_on_render;
    this->poll_events = choose_element_poll_events;
    this->on_hide = choose_element_on_hide;
    return this;
}

struct rr_ui_element *rr_ui_multi_choose_element_init(
    uint8_t (*choose)(struct rr_ui_element *, struct rr_game *), ...)
{
    struct rr_ui_element *this = rr_ui_element_init();
    struct rr_ui_choose_element_metadata *data = malloc(sizeof *data);
    data->choose = choose;
    this->data = data;
    this->resizeable = rr_ui_choose_container;
    va_list args;
    va_start(args, choose);
    while (1)
    {
        struct rr_ui_element *element = va_arg(args, struct rr_ui_element *);
        if (element == NULL)
            break;
        rr_ui_container_add_element(this, element);
    }
    this->on_render = choose_element_on_render;
    this->poll_events = choose_element_poll_events;
    this->on_hide = choose_element_on_hide;
    return this;
}