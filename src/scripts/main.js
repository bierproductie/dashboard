import * as maintain from "./ui-elements/maintain.js"
import * as inventory from "./ui-elements/inventory.js"
import * as btn from "./ui-elements/button.js"
import * as util from "./util.js"

util.loadJS("./scripts/ui-elements/production-control.js");

// Production name and time
//
const updateInterval = 1000; //Miliseconds
const pTime = document.getElementById("pTime");
const pName = document.getElementById("pName");
let batchId = 0;
let startedDT;
let dateTime;

const btnTemp = document.getElementById("btnTemp");
const btnState = document.getElementById("btnState");
const btnProd = document.getElementById("btnProd");
const btnHum = document.getElementById("btnHum");
const btnATP = document.getElementById("btnATP");
const btnAP = document.getElementById("btnAP");
const btnVib = document.getElementById("btnVib");
const btnPPM = document.getElementById("btnPPM");
const btnRP = document.getElementById("btnRP");

const stateArray = {x: [], y: []};
const tempArray = {x: [], y: []};
const humArray = {x: [], y: []};
const vibArray = {x: [], y: []};

fecthMaintainsStatus()
fecthInventoryStatus()

fetch("https://api.bierproductie.nymann.dev/batches/latest/")
    .then(response => response.json())
    .then(data => {
        batchId = data.identifier;
        btnPPM.innerText = data.speed;
        pName.innerText = data.recipe_id;
        btnATP.innerText = data.amount_to_produce;
        // startDT = new Date(date.started_dt); // it is still null from the API
        fecthBtnData();
        fetchGraphData(false);
    });

const MachineState = {
    0 : 'DEACTIVATED',
        1 : 'CLEARING',
        2 : 'STOPPED',
        3 : 'STARTING',
        4 : 'IDLE',
        5 : 'SUSPENDED',
        6 : 'RUNNING',
        7 : 'STOPPING',
        8 : 'ABORTING',
        9 : 'ABORTED',
        10 : 'HOLDING',
        11 : 'HELD',
        15 : 'RESETTING',
        16 : 'COMPLETING',
        17 : 'COMPLETE',
        18 : 'DEACTIVATING',
        19 : 'ACTIVATING'
}

function fecthBtnData(){
    fetch("https://api.bierproductie.nymann.dev/data_over_time/"+batchId+"?page_size=1&page=1")
        .then(response => response.json())
        .then(data => {
            if (data.results[0] !== undefined) {
                btnTemp.innerText = data.results[0].temperature;
                btnState.innerText = MachineState[data.results[0].state];
                btnProd.innerText = data.results[0].produced;
                btnHum.innerText = data.results[0].humidity;
                btnAP.innerText = data.results[0].produced - data.results[0].rejected;
                btnVib.innerText = data.results[0].vibration;
                btnRP.innerText = data.results[0].rejected;
            } else {
                console.log("no entries");
            }
        });
    setTimeout(fecthBtnData, updateInterval);
}



const graphHum = new btn.button('humidity', "HUMIDITY", humArray, [0,1,2,3,4,5]);
const graphVib = new btn.button('vibration', "VIBRATION", vibArray, [0,1,2,3,4,5]);
const graphTemp = new btn.button('temp', "TEMPERATURE" , tempArray, [0,1,2,3,4,5]);
const graphState = new btn.button('state', "STATE", stateArray, [0,1,2,3,4,5]);


function graphUpdater(){
    let marked = document.getElementsByClassName("marked")[0];
    if(marked !== undefined){
        if(marked.children[1].innerText == "HUMIDITY"){
            console.log("HUMIDITY");
            graphHum.update();
        } else if(marked.children[1].innerText == "VIBRATION"){
            graphVib.update();
            console.log("VIBRATION");
        }else if(marked.children[1].innerText == "TEMPERATURE"){
            graphTemp.update();
            console.log("TEMPERATURE");
        }else if(marked.children[1].innerText == "STATE"){
            graphState.update();
            console.log("STATE");
        }


    }
}

function fetchGraphData(bool){
    if(bool){
        fetch("https://api.bierproductie.nymann.dev/data_over_time/"+batchId+"?from_dt="+encodeURIComponent(dateTime)+"&page_size=20&page=1")
            .then(response => response.json())
            .then(data => {
                if(data.results !== undefined && data.results.length > 0){
                    dateTime = data.results[0].measurement_ts;
                    data.results.reverse().forEach(v => {
                        let dateWithTime = new Date(v.measurement_ts); 
                        stateArray.x.push(dateWithTime);
                        stateArray.y.push(v.state);
                        humArray.x.push(dateWithTime);
                        humArray.y.push(v.humidity);
                        vibArray.x.push(dateWithTime);
                        vibArray.y.push(v.vibration);
                        tempArray.x.push(dateWithTime);
                        tempArray.y.push(v.temperature);
                    });
                }
            })

    } else {
        fetch("https://api.bierproductie.nymann.dev/data_over_time/"+batchId+"?page_size=100&page=1")
            .then(response => response.json())
            .then(data => {
                console.log(data);
                dateTime = data.results[0].measurement_ts;
                data.results.reverse().forEach(v => {
                    let dateWithTime = new Date(v.measurement_ts); 
                    stateArray.x.push(dateWithTime);
                    stateArray.y.push(v.state);
                    humArray.x.push(dateWithTime);
                    humArray.y.push(v.humidity);
                    vibArray.x.push(dateWithTime);
                    vibArray.y.push(v.vibration);
                    tempArray.x.push(dateWithTime);
                    tempArray.y.push(v.temperature);
                });
            })

    }
    graphUpdater();
    setTimeout(()=> { fetchGraphData(true); }, updateInterval);
}


function fecthInventoryStatus() {
    fetch("https://api.bierproductie.nymann.dev/inventory_statuses/?page_size=20&page=1")
        .then(response => response.json())
        .then(data => {
            data.results.forEach(v => {
                new inventory.inventory(v.name, v.current_value, v.max_value);
            });
        })
    setTimeout(fecthInventoryStatus, updateInterval);
}

function fecthMaintainsStatus(){
    fetch("https://api.bierproductie.nymann.dev/maintenance/")
        .then(response => response.json())
        .then(data => {
            maintain.setMaintain(data.value);
        })
    setTimeout(fecthMaintainsStatus, updateInterval);
}



