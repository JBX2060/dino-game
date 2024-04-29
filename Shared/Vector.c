
#include <Shared/Vector.h>

#include <math.h>

void rr_vector_set(struct rr_vector *this, float x, float y)
{
    this->x = x;
    this->y = y;
}

void rr_vector_add(struct rr_vector *this, struct rr_vector *right)
{
    this->x += right->x;
    this->y += right->y;
}

void rr_vector_sub(struct rr_vector *this, struct rr_vector *right)
{
    this->x -= right->x;
    this->y -= right->y;
}

void rr_vector_scale(struct rr_vector *this, float v)
{
    this->x *= v;
    this->y *= v;
}

int rr_vector_equals(struct rr_vector *this, struct rr_vector *other)
{
    return this->x == other->x && this->y == other->y;
}

void rr_vector_normalize(struct rr_vector *this)
{
    rr_vector_scale(this, 1 / sqrtf(this->x * this->x + this->y * this->y));
}

void rr_vector_set_magnitude(struct rr_vector *this, float mag)
{
    if (this->x == 0 && this->y == 0)
        return;
    rr_vector_scale(this, mag / sqrtf(this->x * this->x + this->y * this->y));
}

float rr_vector_get_magnitude(struct rr_vector *this)
{
    return sqrtf(this->x * this->x + this->y * this->y);
}

float rr_vector_theta(struct rr_vector *this)
{
    return atan2f(this->y, this->x);
}

void rr_vector_from_polar(struct rr_vector *this, float radius, float angle)
{
    this->x = radius * cosf(angle);
    this->y = radius * sinf(angle);
}

int rr_vector_magnitude_cmp(struct rr_vector *this, float v)
{
    float mag2 = this->x * this->x + this->y * this->y;
    if (mag2 > v * v)
        return 1;
    if (mag2 == v * v)
        return 0;
    return -1;
}