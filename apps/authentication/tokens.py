from rest_framework_simplejwt.tokens import RefreshToken


def get_tokens(user):
    refresh = RefreshToken.for_user(user)

    # 💡 infos ajoutées dans le token
    refresh["role"] = user.role
    refresh["email"] = user.email

    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }
