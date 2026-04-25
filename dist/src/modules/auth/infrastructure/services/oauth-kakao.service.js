"use strict";
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthKakaoService = void 0;
const common_1 = require("@nestjs/common");
const oauth_provider_value_object_1 = require("../../domain/value-objects/oauth-provider.value-object");
const axios_1 = require("axios");
let OAuthKakaoService = class OAuthKakaoService {
  constructor() {
    this.clientId = process.env.KAKAO_CLIENT_ID;
    this.redirectUri = process.env.KAKAO_REDIRECT_URI;
  }
  getAuthUrl(provider) {
    if (provider !== oauth_provider_value_object_1.OAuthProvider.KAKAO)
      throw new Error("Invalid provider");
    return `https://kauth.kakao.com/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&response_type=code`;
  }
  async getUserInfo(provider, code) {
    if (provider !== oauth_provider_value_object_1.OAuthProvider.KAKAO)
      throw new Error("Invalid provider");
    const tokenResponse = await axios_1.default.post("https://kauth.kakao.com/oauth/token", null, {
      params: {
        grant_type: "authorization_code",
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        code,
      },
    });
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    const userInfoResponse = await axios_1.default.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const { id, kakao_account } = userInfoResponse.data;
    const email = kakao_account.email;
    const name = kakao_account.profile?.nickname || "Unknown";
    return {
      provider: oauth_provider_value_object_1.OAuthProvider.KAKAO,
      providerUserId: String(id),
      email,
      name,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    };
  }
};
exports.OAuthKakaoService = OAuthKakaoService;
exports.OAuthKakaoService = OAuthKakaoService = __decorate(
  [(0, common_1.Injectable)()],
  OAuthKakaoService,
);
//# sourceMappingURL=oauth-kakao.service.js.map
