<?php






if (isset($_POST['save'])) {
    echo $_SERVER['URI'];


    echo "Guardar consulta";
    $params = ['name', 'email', 'phone', 'message'];

    foreach ($params as $param) {
        if (!isset($_POST[$param])) {
            echo "Falta agregar " . $param;
            exit;
        }
        $data[$param] = htmlspecialchars($_POST[$param]);
    }

    //Validar la informacion enviada
    if (!validate($data)) {
        echo " <br>La informacion no es valida. ";
        exit;
    }

    $saved = save($data);
    if ($saved) {
        header('location: http://miabogado.uy/?success=true');
    }
}


function validate($params)
{
    $isValid = true;

    if (!isset($params['name']) || empty($params['name']) || is_numeric($params['name'])) {
        $isValid = false;
    }

    return $isValid;
}

//Conectar a la DDBB y guardar 
function save($params)
{
    try {
        // Configuración de la base de datos
        $host = 'localhost';      // Servidor de la BD
        $dbname = 'miabogado';    // Nombre de la base de datos
        $username = 'root';    // Usuario de la BD
        $password = ''; // Contraseña del usuario

        // Crear instancia PDO
        $pdo = new PDO(
            "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
            $username,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, // Manejo de errores con excepciones
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC // Formato de resultados asociativo
            ]
        );

        // Ejemplo de INSERT
        $stmt = $pdo->prepare("INSERT INTO consultas (name, phone,email, message) VALUES (:name, :phone, :email, :message)");
        $stmt->execute([
            'name' => $params['name'],
            'phone' => $params['phone'],
            'email' => $params['email'],
            'message' => $params['message'],
        ]);
        if ($stmt->rowCount() > 0) {
            return true;
        }
        return false;
    } catch (PDOException $e) {
        // Manejo de errores (nunca mostrar detalles en producción)
        die("Error de conexión: " . $e->getMessage());
    }
}
