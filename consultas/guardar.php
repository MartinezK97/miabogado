<?php
// Incluir la clase Database desde la ubicación segura
require_once '/home/miabogad/private/conn.php'; 

if (isset($_POST['save'])) {
    $params = ['name', 'email', 'phone', 'message'];
    $data = [];

    foreach ($params as $param) {
        if (!isset($_POST[$param]) || empty($_POST[$param])) {
            header('Location: https://martinezK97.github.io/miabogado/consultas/no-recibimos-tu-mensaje/');
            exit;
        }
        $data[$param] = htmlspecialchars($_POST[$param]);
    }

    // Validar la información enviada
    if (!validate($data)) {
        header('Location: https://martinezK97.github.io/miabogado/consultas/no-recibimos-tu-mensaje/');
        exit;
    }

    $saved = save($data);
    if ($saved) {
        header('Location: https://martinezK97.github.io/miabogado/consultas/recibimos-tu-mensaje/');
    } else {
        header('Location: https://martinezK97.github.io/miabogado/consultas/no-recibimos-tu-mensaje/');
    }
    exit;
}

function validate($params)
{
    $isValid = true;

    // Validar nombre
    if (empty($params['name']) || is_numeric($params['name'])) {
        $isValid = false;
    }

    // Validar teléfono
    if (empty($params['phone']) || !is_numeric($params['phone'])) {
        $isValid = false;
    }

    // Validar email
    if (!filter_var($params['email'], FILTER_VALIDATE_EMAIL)) {
        $isValid = false;
    }

    // Validar mensaje
    if (empty($params['message']) || strlen($params['message']) > 255) {
        $isValid = false;
    }

    return $isValid;
}

function save($params)
{
    try {
        // Obtener conexión a la base de datos
        $db = Database::getInstance()->getConnection();

        // Preparar y ejecutar la consulta
        $query = $db->prepare("INSERT INTO consultas (name, phone, email, message) 
                             VALUES (:name, :phone, :email, :message)");

        $query->execute([
            'name' => $params['name'],
            'phone' => $params['phone'],
            'email' => $params['email'],
            'message' => $params['message']
        ]);

        if ($query->rowCount() > 0) {
            $to = "contacto@miabogado.uy";
            $subject = "Consulta desde la web";
            $message = "Detalles de la consulta:\n\n"
                . "Nombre: " . $params['name'] . "\n"
                . "Email: " . $params['email'] . "\n"
                . "Teléfono: " . $params['phone'] . "\n"
                . "Mensaje:\n" . $params['message'] . "\n\n"
                . "Fecha: " . date('Y-m-d H:i:s');

            $headers = "From: no-reply@miabogado.uy\r\n"
                . "Reply-To: " . $params['email'] . "\r\n"
                . "X-Mailer: PHP/" . phpversion();

            // Intentar enviar el correo
            if (mail($to, $subject, $message, $headers)) {
                // Registro de éxito
                error_log('Correo enviado a ' . $to);
            } else {
                // Registro de error
                error_log('Error al enviar correo a ' . $to);
            }
            return true;
        }
        return false;
    } catch (PDOException $e) {
        // Registrar error sin mostrar detalles al usuario
        error_log('Error en guardar consulta: ' . $e->getMessage());
        error_log('Consulta no guardada: ' . $params['message'] . " de " . $params['email']);
        return false;
    }
}
