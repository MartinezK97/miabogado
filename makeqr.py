import qrcode
from PIL import Image

# Configuración del código QR
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=10,
    border=4
)

# URL destino (sin fecha de expiración)
url = "https://martinezk97.github.io/miabogado/"

# Generar código QR
qr.add_data(url)
qr.make(fit=True)

# Crear imagen y guardar
img = qr.make_image(fill_color="black", back_color="white")
img.save("qr_miabogado.png")

print("✅ Código QR generado: qr_miabogado.png")