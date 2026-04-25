"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthGoogleService = void 0;
const common_1 = require("@nestjs/common");
const oauth_provider_value_object_1 = require("../../domain/value-objects/oauth-provider.value-object");
const axios_1 = require("axios");
let OAuthGoogleService = class OAuthGoogleService {
    constructor() {
        this.clientId = process.env.GOOGLE_CLIENT_ID;
        this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        this.redirectUri = process.env.GOOGLE_REDIRECT_URI;
    }
    getAuthUrl(provider) {
        if (provider !== oauth_provider_value_object_1.OAuthProvider.GOOGLE)
            throw new Error('Invalid provider');
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&response_type=code&scope=email%20profile`;
    }
    async getUserInfo(provider, code) {
        if (provider !== oauth_provider_value_object_1.OAuthProvider.GOOGLE)
            throw new Error('Invalid provider');
        const tokenResponse = await axios_1.default.post('https://oauth2.googleapis.com/token', {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            code,
            redirect_uri: this.redirectUri,
            grant_type: 'authorization_code',
        });
        const { access_token, refresh_token, expires_in } = tokenResponse.data;
        const userInfoResponse = await axios_1.default.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        const { id, email, name } = userInfoResponse.data;
        return {
            provider: oauth_provider_value_object_1.OAuthProvider.GOOGLE,
            providerUserId: id,
            email,
            name,
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: new Date(Date.now() + expires_in * 1000),
        };
    }
};
exports.OAuthGoogleService = OAuthGoogleService;
exports.OAuthGoogleService = OAuthGoogleService = __decorate([
    (0, common_1.Injectable)()
], OAuthGoogleService);
//# sourceMappingURL=oauth-google.service.js.map