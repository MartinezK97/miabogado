
let irpfConfig = null;

async function cargarIRPF() {
    try {
        const res = await fetch("http://miabogado.uy/assets/json/irpf.json");
        if (!res.ok) throw new Error("No se pudo cargar el archivo");
        const data = await res.json();
        irpfConfig = data;
        // console.log("IRPF cargado:", data);
    } catch (error) {
        console.error("Error al cargar datos de IRPF:", error);
    }
}

window.onload = async function () {
    await cargarIRPF();

    // Escuchar cambios en inputs dentro del contenedor
    document.querySelectorAll('#calculadoraDeSueldo input').forEach(input => {
        input.addEventListener('input', calcularSueldo);
    });

    document.querySelectorAll('input[name="hasChilds"]').forEach(radio => {
        radio.addEventListener('change', calcularSueldo);
    });
};

function calcularSueldo() {
    if (!irpfConfig) return; // no continuar si aún no está cargado

    const sueldoInput = document.getElementById('sueldo_nominal');
    const sueldo = parseFloat(sueldoInput.value) || 0;

    const selected = document.querySelector('input[name="hasChilds"]:checked');
    const tieneHijos = selected ? parseInt(selected.value) : 0;



    // Descuentos fijos
    const montepio = sueldo * 0.15;
    const fonasa = sueldo * 0.03;
    const frl = sueldo * 0.00125;

    // Asignaciones familiares
    const asnis_percent = tieneHijos ? 3 : 1.5;
    const asnis_amount = sueldo * (asnis_percent / 100);


    document.getElementById("asnis_percent").innerHTML = asnis_percent + "%";
    document.getElementById("asnis_amount").innerHTML = "$" + asnis_amount.toFixed(2);

    // IRPF en base al sueldo nominal
    const irpf = calcularIRPF(sueldo);

    const irpf_percent = irpf.rate;
    const irpf_amount = irpf.discount_amount;

    // Total descuentos
    const descuento_total = montepio + fonasa + frl + asnis_amount + irpf_amount;
    const sueldo_liquido = sueldo - descuento_total;

    // Mostrar resultados
    document.getElementById("montepio").innerHTML = "$" + num(montepio);
    document.getElementById("frl").innerHTML = "$" + num(frl);
    document.getElementById("fonasa").innerHTML = "$" + num(fonasa);

    //IRPF
    document.getElementById("irpf_percent").innerHTML = num(irpf_percent) + "%";
    document.getElementById("irpf_amount").innerHTML = "$" + num(irpf_amount);
    // Precio de BPC 
    document.getElementById("bpc_price").innerHTML = "$" + num(irpf.price_bpc);
    document.getElementById("bpc_range").innerHTML = irpf.min_bpc + " - " + irpf.max_bpc;
    document.getElementById("amount_range").innerHTML = "$" + irpf.min_amount + " - $" + irpf.max_amount;
    document.getElementById("discount_percent").innerHTML = irpf.rate + "%";

    document.getElementById("total_discount_amount").innerHTML = "$" + num(descuento_total);


    document.getElementById("sueldo_nominal").innerHTML = "$" + num(sueldo);
    document.getElementById("sueldo_liquido").innerHTML = "$" + num(sueldo_liquido);

    const allDiscountsChart = [];
    allDiscountsChart.push(['Haber', 'Monto']);
    allDiscountsChart.push(['BPS', montepio]);
    allDiscountsChart.push(['Fonasa', fonasa + asnis_amount]);
    allDiscountsChart.push(['FRL', frl]);
    allDiscountsChart.push(['IRPF', irpf_amount]);
    allDiscountsChart.push(['Sueldo Liquido', sueldo_liquido]);

    console.log("Montepío:", montepio);
    drawChartAllDiscounts(allDiscountsChart)
}


function drawChartAllDiscounts(dataArray) {
    document.getElementById("content-charts").style.display = "block";
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(() => {
        const data = google.visualization.arrayToDataTable(dataArray);

        const options = {

            title: 'Resumen de Haberes',
            titleTextStyle: {
                color: '#1a3a5f',
                fontSize: 20,
                bold: true
            },
            legend: {
                position: 'bottom',
                alignment: 'center',
                maxLines: 10
              },
            is3D:true,
            colors: ['#5d0000', '#b83d3d', '#8f3600', '#ffbdbd', '#145d00'],
            sliceVisibilityThreshold: 0,
            chartArea: {
                left: "10%",          // Sin margen izquierdo
                top: "1rem",          // Espacio solo para el título
                width: '100%',    // Ocupa todo el ancho
                height: '75%'     // 75% del alto disponible
              },
        };

        const chart = new google.visualization.PieChart(document.getElementById('all-discounts'));
        chart.draw(data, options);
    });
}

function calcularIRPF(ingresoBruto) {
    const bpc = irpfConfig.bpc;
    const ranges = irpfConfig.ranges; // Debe estar ordenado de menor a mayor
    let totalImpuesto = 0;
    let tramoSuperior = null;

    // 1. Calcular impuesto por cada tramo acumulativo
    for (const tramo of ranges) {
        const limiteInferior = tramo.from * bpc;
        const limiteSuperior = tramo.to * bpc;

        // Si el ingreso no supera el límite inferior del tramo, saltar
        if (ingresoBruto <= limiteInferior) break;

        // Calcular el monto gravable en este tramo
        const excedente = Math.min(ingresoBruto, limiteSuperior) - limiteInferior;
        console.log("Excedente: $"+excedente)
        const impuestoTramo = excedente * (tramo.rate / 100);

        totalImpuesto += impuestoTramo;
        tramoSuperior = tramo; // Último tramo aplicado
        console.log("$" + impuestoTramo + " en el tramo: ", tramo)

    }

    // 2. Si no se aplicó ningún tramo, usar el primero (ej: ingresos < 15 BPC)
    if (tramoSuperior === null) {
        tramoSuperior = ranges[0];
    }
    drawChartAllDiscounts();
    return {
        "price_bpc": bpc,
        "min_bpc": tramoSuperior.from,
        "min_amount": tramoSuperior.from * bpc,
        "max_bpc": tramoSuperior.to,
        "max_amount": tramoSuperior.to * bpc,
        "rate": tramoSuperior.rate,
        "discount_amount": totalImpuesto, // Total acumulado de todos los tramos
    };
}




function num(n) {
    const numero = parseFloat(n);
    if (isNaN(numero)) return 'NaN';

    return numero.toFixed(2)
        .replace('.', ',')
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}