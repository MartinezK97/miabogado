let irpfConfig = null;

async function cargarIRPF() {
    try {
        const res = await fetch("https://martinezk97.github.io/miabogado/assets/json/irpf.json");
        if (!res.ok) throw new Error("No se pudo cargar el archivo");
        const data = await res.json();
        irpfConfig = data;
        console.log("IRPF cargado:", data);
    } catch (error) {
        console.error("Error al cargar IRPF:", error);
    }
}

window.onload = async function () {
    await cargarIRPF();
    document.getElementById("range-2").style.display = 'none';
    document.getElementById("range-3").style.display = 'none';
    document.getElementById("range-4").style.display = 'none';
    document.getElementById("range-5").style.display = 'none';
    document.getElementById("range-6").style.display = 'none';
    document.getElementById("range-7").style.display = 'none';
    document.getElementById("range-8").style.display = 'none';
    // Escuchar cambios en inputs dentro del contenedor
    document.getElementById('irpf_nominal').addEventListener('input', init);



};

function init(){
    console.log("Init run")
    const nominal =  parseFloat(document.getElementById("irpf_nominal").value)
    if(nominal == 0 || nominal == null){
        console.log("El nominal es invalido")
        return false;
    }
    const irpf = calcularIRPF(nominal);
    console.log(irpf)

    if(irpf){
        document.getElementById('nominal_amount').innerHTML = num(nominal.toFixed(2));
        var nominal_BPC = parseFloat(irpf.nominal_en_BPC)
        document.getElementById("total_bpc").innerHTML = (nominal_BPC.toFixed(2) + " BPC")
        
        if (irpf.steps) {
            // Obtener las claves numéricas del objeto
            const stepKeys = Object.keys(irpf.steps)
                .filter(key => !isNaN(key))  // Solo claves numéricas
                .sort((a, b) => a - b);     // Orden ascendente

            // Iterar usando las claves
            for (var i = 0; i < stepKeys.length; i++) {
                const stepKey = stepKeys[i];
                var elem = document.getElementById("range-" + (i + 1));
                var exceso = document.querySelector("#range-" + (i + 1) + " .exceced p");
                var tasa = document.querySelector("#range-" + (i + 1) + " .range p");
                var retencion = document.querySelector("#range-" + (i + 1) + " .amount p");
                elem.style.display = 'grid';
                exceso.innerHTML = "$" + num(irpf.steps[stepKey].exceso);
                tasa.innerHTML = (irpf.steps[stepKey].tasa) + "%";
                // retencion.innerHTML = "$" + num(irpf.steps[stepKey].amount);
                retencion.innerHTML = "$" + num(irpf.steps[stepKey].amount);
                console.log("Índice:", i, "Clave real:", stepKey);
                console.log("Contenido:", irpf.steps[stepKey]);
            }
        }

        document.querySelector("#total_discount_amount").innerHTML = num(irpf.total_discount)
        document.querySelector("#monto_liquido").innerHTML = num(nominal - irpf.total_discount)
        

    }

   

}


function calcularIRPF(nominal) {

    const bpc = irpfConfig.bpc;
    const ranges = irpfConfig.ranges; // Debe estar ordenado de menor a mayor
    var nominalEnBPC = (nominal / bpc);
    var mni = bpc * 7
    var res = {
        "bpc": bpc,
        "nominal": nominal,
        "nominal_en_BPC": nominalEnBPC,
        "steps":{}
    }

    if(nominal < mni){ return false;}

    var total_discount = 0;
    for(var i=0; i < ranges.length; i++){
            var minAmount = ranges[i].from * bpc
            var maxAmount = ranges[i].to * bpc
            var dif = 0;
            var range_discount = 0;
            if(nominal > minAmount){
                // Si el monto no supera la berrera superior
                if(nominal < maxAmount){
                    dif = nominal - minAmount
                    range_discount = (ranges[i].rate / 100) * dif
                    total_discount += range_discount
                    res["steps"][i] = {
                        "exceso": dif,
                        "tasa": ranges[i].rate,
                        "amount": range_discount,
                    }
                }else{
                    // El monto supera la barrera superior
                    dif = maxAmount - minAmount
                    range_discount = (ranges[i].rate / 100) * dif
                    total_discount += range_discount
                    res["steps"][i] = {
                        "exceso":dif,
                        "tasa": ranges[i].rate,
                        "amount":range_discount,
                    }
                }

            }
    }

    res["total_discount"] = total_discount;
    res["liquido"] = nominal - total_discount;
    return res;
}


function num(n) {
    const numero = parseFloat(n);
    if (isNaN(numero)) return 'NaN';

    return numero.toFixed(2)
        .replace('.', ',')
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}