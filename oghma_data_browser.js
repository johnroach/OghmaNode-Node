// Creates a websocket with socket.io
// Make sure to install socket.io: terminal, goto /var/lib/cloud9 and enter: npm install socket.io
// Installing this takes a few minutes; wait until the installation is complete

var path = require('path');
var fs = require('fs');
var b = require('bonescript');
var NanoTimer = require('nanotimer');

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

io.sockets.on('connection', function (socket) {

    socket.on('initialize',function(init_bool){
        //need to get list of sensors after stop (i.e. before a experiment starts)

        if (init_bool=='true')
        {
            var sensors='';
            current_time=0; //zero current time for next experiment

            //here we check which sensors are connected
            //on port 1

            var port1_value=parseFloat(b.analogRead('P9_39')).toFixed(2);
            var port1_analog_value=parseFloat(b.analogRead('P9_40')).toFixed(3);
            if(  (port1_value<=0.52) && (port1_value>=0.49) )
            {
                //console.log("Pressure sensor connected on port 1");
                sensors='port1:pressure:'+printPressure(port1_analog_value)+','+sensors;
            }else if((port1_value<=0.1) && (port1_value>=0.09))
            {
                //console.log("Temp sensor connected on port 1");
                sensors='port1:temp:'+printTemp(port1_analog_value)+','+sensors;
            }else
            {
                //console.log("No sensors on port 1");
                sensors='port1:null,'+sensors;
            }

            //here we check which sensors are connected
            //on port 2
            var port2_value=parseFloat(b.analogRead('P9_37')).toFixed(2);
            var port2_analog_value=parseFloat(b.analogRead('P9_38')).toFixed(3);

            if(  (port2_value<=0.52) && (port2_value>=0.49) )
            {
                //console.log("Pressure sensor connected on port 2");
                sensors='port2:pressure:'+printPressure(port2_analog_value)+','+sensors;
            }else if((port2_value<=0.1) && (port2_value>=0.09))
            {
                //console.log("Temp sensor connected on port 2");
                sensors='port2:temp:'+printTemp(port2_analog_value)+','+sensors;
            }else
            {
                //console.log("No sensors on port 2");
                sensors='port2:null,'+sensors;
            }

            //here we check which sensors are connected
            //on port 3
            var port3_value=parseFloat(b.analogRead('P9_35')).toFixed(2);
            var port3_analog_value=parseFloat(b.analogRead('P9_36')).toFixed(3);

            if( (port3_value<=0.52) && (port3_value>=0.49) )
            {
                //console.log("Pressure sensor connected on port 3");
                sensors='port3:pressure:'+printPressure(port3_analog_value)+','+sensors;
            }else if((port3_value<=0.1) && (port3_value>=0.09))
            {
                //console.log("Temp sensor connected on port 3");
                sensors='port3:temp:'+printTemp(port3_analog_value)+','+sensors;
            }else
            {
                //console.log("No sensors on port 3");
                sensors='port3:null,'+sensors;
            }

            socket.emit('sensors', sensors);
            //socket.broadcast.emit('sensors', sensors);
        }else
        {
            console.log("user stopped init");
        }
    });

    socket.on('start_data_collection',function(data_collection_bool,timer_interval){
        if(data_collection_bool=='true')
        {
            time_interval=parseInt(timer_interval);
            timer.setInterval(savedata, '', timer_interval+'m');
            //@TODO Maybe we can later on add some sort of limit to data collection??
            //timer.setTimeout(liftOff, [timer], '10s');
        }else
        {
            timer.clearInterval();
        }

        function savedata()
        {//creates a formatted string

            var port1_sensor_data='';
            var port2_sensor_data='';
            var port3_sensor_data='';

            var sensors_json='{"time":"'+current_time+'",';

            //here we check which sensors are connected
            //on port 1
            var port1_value=parseFloat(b.analogRead('P9_39')).toFixed(2);
            var port1_analog_value=parseFloat(b.analogRead('P9_40')).toFixed(3);
            if(  (port1_value<=0.52) && (port1_value>=0.49) )
            {
                //console.log("Pressure sensor connected on port 1");
                port1_sensor_data='"pressure:"'+printPressure(port1_analog_value)+'","P1":"pressure",';

            }else if((port1_value<=0.1) && (port1_value>=0.09))
            {
                //console.log("Temp sensor connected on port 1");
                port1_sensor_data='"temp":"'+printTemp(port1_analog_value)+'","P1":"temp",';
            }else
            {
                //console.log("No sensors on port 1");
                port1_sensor_data='"P1":"null",';
            }

            sensors_json = sensors_json+port1_sensor_data;


            //here we check which sensors are connected
            //on port 2
            var port2_value=parseFloat(b.analogRead('P9_37')).toFixed(2);
            var port2_analog_value=parseFloat(b.analogRead('P9_38')).toFixed(3);

            if(  (port2_value<=0.52) && (port2_value>=0.49) )
            {
                //console.log("Pressure sensor connected on port 2");
                port2_sensor_data='"pressure":"'+printPressure(port2_analog_value)+'","P2":"pressure",';
            }else if((port2_value<=0.1) && (port2_value>=0.09))
            {
                //console.log("Temp sensor connected on port 2");
                port2_sensor_data='"temp":"'+printTemp(port2_analog_value)+'","P2":"temp",';
            }else
            {
                //console.log("No sensors on port 2");
                port2_sensor_data='"P2":"null",';
            }

            sensors_json = sensors_json+port2_sensor_data;


            //here we check which sensors are connected
            //on port 3
            var port3_value=parseFloat(b.analogRead('P9_35')).toFixed(2);
            var port3_analog_value=parseFloat(b.analogRead('P9_36')).toFixed(3);

            if( (port3_value<=0.52) && (port3_value>=0.49) )
            {
                //console.log("Pressure sensor connected on port 3");
                port3_sensor_data='"pressure":"'+printPressure(port3_analog_value)+'","P3":"pressure",';
            }else if((port3_value<=0.1) && (port3_value>=0.09))
            {
                //console.log("Temp sensor connected on port 3");
                port3_sensor_data='"temp":"'+printTemp(port3_analog_value)+'","P3":"temp",';
            }else
            {
                //console.log("No sensors on port 3");
                port3_sensor_data='"P3":"null"';
            }

            sensors_json = sensors_json+port3_sensor_data;

            full_dataset = sensors_json + '},' + full_dataset ;

            current_time=parseInt(time_interval)+parseInt(current_time);

            //console.log('collected_sensor_data, '+sensors);
            var pick_me = full_dataset.substring(0, full_dataset.length - 1);
            socket.emit('collected_sensor_data',('{"data":['+pick_me+']}'));

        }

    });

});





function printPressure(x) {

    var pressure = 0;

    var analogVoltage = x*1.8; // ADC Value converted to voltage

    pressure = (analogVoltage*2.7 -2.4)*1000/19.2;

    return parseFloat(pressure).toFixed(3).toString() ;

}

function printTemp(x) {

    var temp = 0;

    var analogVoltage = x*1.8; // ADC Value converted to voltage

    temp = (analogVoltage*101.25) - 55;

    return parseFloat(temp).toFixed(3) ;

}


// Get server IP address on LAN
function getIPAddress() {
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