var path = require('path');
var fs = require('fs');
var b = require('bonescript');
var NanoTimer = require('nanotimer');

//define digital inputs
b.pinMode("P9_11", b.INPUT);
b.pinMode("P9_12", b.INPUT);

//need to broadcast where I am to server so the android can pick it up
/*var socketing = require('socket.io-client')('http://192.168.0.17:8087');
 socketing.on('connect', function(){
 socketing.emit('serial:ip','000-000-000-000:'+getIPAddress());
 socketing.on('event', function(){});
 socketing.on('disconnect', function(){});
 });*/


var app = require('http').createServer(function (request, response) {
    console.log('request starting...');

    var filePath = '.' + request.url;
    if (filePath == './')
        filePath = './index.html';

    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
    }

    fs.exists(filePath, function(exists) {

        if (exists) {
            fs.readFile(filePath, function(error, content) {
                if (error) {
                    response.writeHead(500);
                    response.end();
                }
                else {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                }
            });
        }
        else {
            response.writeHead(404);
            response.end();
        }
    });

});


app.listen(8090);

var io = require('socket.io').listen(app);

console.log('Server running on: http://' + getIPAddress() + ':8090');

//timer settings
var current_time=0;
var time_interval=0;
var timer = new NanoTimer();
var full_dataset='';

io.sockets.on('connection', function (socket){

    socket.on('initialize',function(init_bool){
        //need to get list of sensors after stop (i.e. before a experiment starts)

        if (init_bool=='true')
        {

            current_time=0; //zero current time for next experiment

            var sensors_and_data='{"time":"'+current_time+ '",'+get_sensor_type_and_value("P1")
                + ','+get_sensor_type_and_value("P2")
                + ','+get_sensor_type_and_value("P3")
                + ','+get_sensor_type_and_value("DIGI")
                + '}' ;

            socket.emit('sensors',('{"data":['+sensors_and_data+']}'));
            //socket.broadcast.emit('sensors', sensors);

        }
    });

    socket.on('start_data_collection',function(data_collection_bool,timer_interval){
        if(data_collection_bool=='true')
        {
            time_interval=parseInt(timer_interval);
            timer.setInterval(savedata, '', timer_interval+'m');
            //timer.setTimeout(liftOff, [timer], '10s');
        }else
        {
            timer.clearInterval();
        }

        function savedata()
        {//creates a formatted string

            full_dataset='{"time":"'+current_time+ '",'+get_sensor_type_and_value("P1")
                                                     + ','+get_sensor_type_and_value("P2")
                                                     + ','+get_sensor_type_and_value("P3")
                                                     + ','+get_sensor_type_and_value("DIGI")
                                                     + '},' + full_dataset ;

            current_time=parseInt(time_interval)+parseInt(current_time);

            var pick_me = full_dataset.substring(0, full_dataset.length - 1);
            socket.emit('collected_sensor_data',('{"data":['+pick_me+']}'));

        }

    });

});


function get_sensor_type_and_value(port_number){
    //this function takes port code as parameter
    //Port numbers can be P1,P2,P3,DIGI
    //returns a json string
    // sample below:
    // get_sensor_type_value(P1);
    // returned value : "pressure":"<pressure_value>","P1":"pressure"

    var formatted_result="";

    switch (port_number) {
        case "P1":
            //here we check which sensors are connected
            //on port 1
            var port1_value=parseFloat(b.analogRead('P9_39')).toFixed(2);
            var port1_analog_value=parseFloat(b.analogRead('P9_40')).toFixed(3);
            console.log(port1_value);
            if(  (port1_value<=0.52) && (port1_value>=0.49) )
            {
                formatted_result='"pressure:"'+printPressure(port1_analog_value)+'","P1":"pressure"';
            }else if((port1_value<=0.35) && (port1_value>=0.33))
            {
                formatted_result='"voltage":"'+printVoltage(port1_analog_value)+'","P1":"voltage"';
            }else if((port1_value<=0.1) && (port1_value>=0.09))
            {
                formatted_result='"temp":"'+printTemp(port1_analog_value)+'","P1":"temp"';
            }else
            {
                formatted_result='"P1":"null"';
            }

            break;

        case "P2":
            //here we check which sensors are connected
            //on port 2
            var port2_value=parseFloat(b.analogRead('P9_37')).toFixed(2);
            var port2_analog_value=parseFloat(b.analogRead('P9_38')).toFixed(3);
            console.log(port2_value);
            if(  (port2_value<=0.52) && (port2_value>=0.49) )
            {
                formatted_result='"pressure":"'+printPressure(port2_analog_value)+'","P2":"pressure"';
            }else if((port2_value<=0.35) && (port2_value>=0.33))
            {
                formatted_result='"voltage":"'+printVoltage(port2_analog_value)+'","P2":"voltage"';
            }else if((port2_value<=0.1) && (port2_value>=0.09))
            {
                formatted_result='"temp":"'+printTemp(port2_analog_value)+'","P2":"temp"';
            }else
            {
                formatted_result='"P2":"null"';
            }

            break;

        case "P3":

            //here we check which sensors are connected
            //on port 3
            var port3_value=parseFloat(b.analogRead('P9_35')).toFixed(2);
            var port3_analog_value=parseFloat(b.analogRead('P9_36')).toFixed(3);
            console.log(port3_value);
            if( (port3_value<=0.52) && (port3_value>=0.49) )
            {
                formatted_result='"pressure":"'+printPressure(port3_analog_value)+'","P3":"pressure"';
            }else if((port3_value<=0.35) && (port3_value>=0.33))
            {
                formatted_result='"voltage":"'+printVoltage(port3_analog_value)+'","P3":"voltage"';
            }else if((port3_value<=0.1) && (port3_value>=0.09))
            {
                formatted_result='"temp":"'+printTemp(port3_analog_value)+'","P3":"temp"';
            }else
            {
                formatted_result='"P3":"null"';
            }

            break;
        case "DIGI":
            //here we read the digital value
            //no need to check
            //var port4_detection_value=parseFloat(b.analogRead('P9_33')).toFixed(2);
            //var port4_digital_value=b.digitalRead('P9_12');
            //console.log("port4_detection_value:"+port4_detection_value);
            //console.log("port4_digital_value"+port4_digital_value);
            formatted_result='"DIGI":"null"';
            break;
    }

    return formatted_result;

}

function printPressure(x){

    var pressure;

    var analogVoltage = x*1.8; // ADC Value converted to voltage

    pressure = (analogVoltage*2.7 -2.4)*1000/19.2;

    return parseFloat(pressure).toFixed(3).toString() ;

}

function printTemp(x){

    var temp;

    var analogVoltage = x*1.8; // ADC Value converted to voltage

    temp = (analogVoltage*101.25) - 55;

    return parseFloat(temp).toFixed(3) ;

}

function printVoltage(x){

    var voltage;

    var analogVoltage = x*1.8; // ADC Value converted to voltage

    voltage = (2*((analogVoltage*33.3)-27.2))+0.3;

    return parseFloat(voltage).toFixed(3).toString() ;

}

function printCurrent(x){

    var current;

    current = (x-0.206)*54.05;

    return parseFloat(current).toFixed(3).toString() ;

}


// Get server IP address on LAN
function getIPAddress(){
        var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
        var iface = interfaces[devName];
        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
                return alias.address;
        }
    }
    return '0.0.0.0';
}