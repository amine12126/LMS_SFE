import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

names = [
    ("Ahmed", "Benali"), ("Sara", "El Idrissi"), ("Mehdi", "Bennani"), ("Fatima", "Zahra"),
    ("Youssef", "Alaoui"), ("Hajar", "Amrani"), ("Omar", "Chraibi"), ("Khadija", "Tazi"),
    ("Amine", "El Fassi"), ("Imane", "Berrada"), ("Karim", "Zouhair"), ("Salma", "Filali"),
    ("Hassan", "Bouzid"), ("Nadia", "Lahlou"), ("Yassine", "Ghazali"), ("Meryem", "El Oufir"),
    ("Ilyas", "Daoudi"), ("Zineb", "Hassani"), ("Anas", "Kettani"), ("Houda", "Tahiri"),
    ("Nabil", "Rami"), ("Sanae", "El Mernissi"), ("Ayoub", "El Amrani"), ("Leila", "Bennis"),
    ("Zakaria", "Belhaj"), ("Ghita", "Ouzzani"), ("Tarik", "Moutawakil"), ("Samira", "Jazouli"),
    ("Reda", "El Khattabi"), ("Asma", "El Kabbaj"), ("Hamza", "Berrada"), ("Kawtar", "Ibnou"),
    ("Adil", "El Malki"), ("Lamia", "Boujibar"), ("Soufiane", "Touzani"), ("Nawal", "El Hachimi"),
    ("Mounir", "Belghiti"), ("Hind", "Sabiri"), ("Badr", "Lemsyech"), ("Safia", "El Mansouri"),
    ("Othmane", "Bennani"), ("Naima", "El Yazghi"), ("Abdel", "Ouazzani"), ("Rim", "Iraqi"),
    ("Walid", "Bakkali"), ("Yasmine", "Ghazali"), ("Rachid", "Benjelloun"), ("Loubna", "Kettani"),
    ("Faycal", "Majdoubi"), ("Chaymae", "Harthi")
]

created_count = 0
for i, (prenom, nom) in enumerate(names, start=1):
    ggid = f"B{i:03d}"
    
    # Nettoyer les espaces et mettre en minuscules
    prenom_clean = prenom.lower().replace(' ', '')
    nom_clean = nom.lower().replace(' ', '')
    
    email = f"{prenom_clean}.{nom_clean}@capgemini.com"
    password = f"{prenom_clean}{nom_clean}123456"
    
    # Vérifier si l'email ou le GGID existe déjà
    if not User.objects.filter(email=email).exists() and not User.objects.filter(ggid=ggid).exists():
        User.objects.create_user(
            email=email,
            password=password,
            nom=nom,
            prenom=prenom,
            ggid=ggid,
            role="consultant",
            niveau="N02"
        )
        created_count += 1
        print(f"Cree : {email} | GGID : {ggid} | Pass : {password}")
    else:
        print(f"Ignore (Existe deja) : {email} ou GGID: {ggid}")

print(f"\nOperation terminee : {created_count} consultants generes avec succes.")
