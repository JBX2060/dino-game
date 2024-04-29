
#pragma once

#include <Shared/StaticData.h>
#include <Shared/Utilities.h>

#ifdef RIVET_BUILD
#define RR_BASE_API_URL "https://rwar.fun/api/"
#else
#define RR_BASE_API_URL "http://localhost:55554/"
#endif
#ifdef RR_SERVER
#define RR_API_SECRET                                                          \
    "n98r4w4qbd9rt40ygr4wd34pawd3dngaytgnaiarn3f38bnfat4pay3vui"
#else
#define RR_API_SECRET "function a(b) { return k[b], aa[n.v], r.eG[g.b]; };"
#endif

void rr_api_get_password(char const *, void *);

void rr_api_get_server_alias(char const *, void *);