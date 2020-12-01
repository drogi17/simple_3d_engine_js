var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

///////////////////////////////

canvas.width = 1900;
canvas.height = 900;
var center_x = canvas.width/2;
var center_y = canvas.height/2;


//////////////////////////////////////////////////////////////////////

class World {
    constructor() {
        this.models = [];
    }

    add_cube (position){
        this.models.push({
            'points': [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]],
            'connections': [[0, 1], [0, 3], [0, 4],  [2, 3], [2, 1], [2, 6],  [5, 4], [5, 1], [5, 6],  [7, 4], [7, 3], [7, 6]],
            'pos': position,
            'color': '#fff',
            'line_width': 1,
            'resize': 1,
        });
    }
    add_axes(){
       this.models.push({
            'points':  [ [0, 0, 0], [100, 0, 0], [0, 100, 0], [0, 0, 100],],
            'connections': [[0, 1], [0, 2], [0, 3]],
            'pos': [0, 0, 0],
            'color': '#FF0000',
            'line_width': 3,
            'resize': 1,
        });
    }
    add_girl(){
     this.models.push(girl_model);
    }
    add_car(){
        this.models.push(car_model);
    }
}



class Camera {
    constructor() {
        this.pos = [0, 0, -5];
        this.mouse_angle = [Math.PI/2, Math.PI/2];
        this.mouse_pos = [0,0];
    }

    rotation_camera(pos, angle) {
        var x = pos[0];
        var y = pos[1];
        var sin = Math.sin(angle);
        var cos = Math.cos(angle);
        var x_r = y*cos - x*sin;
        var y_r = x*cos + y*sin;
        return [x_r, y_r];
    }
}

function draw_hud(ctx, mouse_pos, angle, camera_pos){
    ctx.font = "15px mono";
    ctx.fillStyle = '#fff';
    ctx.fillText("Mouse pos: " + mouse_pos, 20, 20);
    ctx.fillText("Angle: " + angle, 20, 40);
    ctx.fillText("Camera pos: " + camera_pos, 20, 60);
}


function draw_crosshair(ctx, center_x, center_y){
    ctx.beginPath();
    ctx.moveTo(center_x-7, center_y);
    ctx.lineTo(center_x+7, center_y);
    ctx.moveTo(center_x, center_y-7);
    ctx.lineTo(center_x, center_y+7);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FF0000';
    ctx.stroke();
}

function convert_pos(position, center_x, center_y){
    x = position[0];
    y = position[1];
    z = position[2];
    var draw_x = x*(center_x/z)+center_x;
    var draw_y = y*(center_y/z)+center_y;
    return [draw_x, draw_y];
}

function clip_z(points){
    // console.log(points);
    near = 0.001;
    k = (near-points[0][2])/(points[1][2]-points[0][2]);
    x = k*(points[1][0]-points[0][0])+points[0][0];
    y = k*(points[1][1]-points[0][1])+points[0][1];
    return [x, y, near];
}

function main(camera, world) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw_hud(ctx, camera.mouse_pos, camera.mouse_angle, camera.pos);
    draw_crosshair(ctx, center_x, center_y);
    for (var model_id = 0; model_id < world.models.length; model_id++){
        var model = world.models[model_id];
        for (var connection_id = 0; connection_id < model["connections"].length; connection_id++) {
            var points_to_draw = [];
            var transformed = [];
            for (var point_id = 0; point_id < model["connections"][connection_id].length; point_id++) {
                var x = model["points"][model["connections"][connection_id][point_id]][0]/model['resize'] - camera.pos[0] + model["pos"][0];
                var y = model["points"][model["connections"][connection_id][point_id]][1]/model['resize'] - camera.pos[1] + model["pos"][1];
                var z = model["points"][model["connections"][connection_id][point_id]][2]/model['resize'] - camera.pos[2] + model["pos"][2];
                x_z = camera.rotation_camera([x, z], camera.mouse_angle[0]); x = x_z[0]; z = x_z[1];
                y_z = camera.rotation_camera([y, z], camera.mouse_angle[1]); y = y_z[0]; z = y_z[1];
                transformed.push([x, y, z]);
            }
            for (var i = 0; i < transformed.length-1; i++) {
                if (transformed[i][2] > 0 && transformed[i+1][2] > 0){
                    points_array2d = [convert_pos(transformed[i], center_x, center_y), 
                                      convert_pos(transformed[i+1], center_x, center_y)];
                } else if (transformed[i][2] > 0){
                    points_array2d = [convert_pos(transformed[i], center_x, center_y), 
                                      convert_pos(clip_z([transformed[i], transformed[i+1]]), center_x, center_y)];
                } else if (transformed[i+1][2] > 0){
                    points_array2d = [convert_pos(clip_z([transformed[i], transformed[i+1]]), center_x, center_y), 
                                      convert_pos(transformed[i+1], center_x, center_y)];
                }
                ctx.beginPath();
                ctx.moveTo(points_array2d[0][0], points_array2d[0][1]);
                ctx.lineTo(points_array2d[1][0], points_array2d[1][1]);
                ctx.lineWidth = model["line_width"];
                ctx.strokeStyle = model['color'];
                ctx.stroke();
            }
        }
    }
}

camera = new Camera();
world = new World();
world.add_cube([0,0,0]);
world.add_cube([3,0,0]);
world.add_axes();
world.add_car();
// world.add_girl();
setInterval( () => main(camera, world), 10);


var control_keys = {
    "up": "Space",
    "down": "ShiftLeft",
    "forward": "KeyW",
    "back": "KeyS",
    "left": "KeyA",
    "right": "KeyD"
}

var keys_status = {
    "up": false,
    "down": false,
    "forward": false,
    "back": false,
    "left": false,
    "right": false
}


document.addEventListener("keydown", event => {
    if (event.code == control_keys["down"]){
        keys_status["down"] = true;
    }
    if (event.code == control_keys["up"]){
        keys_status["up"] = true;
    }
    if (event.code == control_keys["forward"]){
        keys_status["forward"] = true;
    } 
    if (event.code == control_keys["back"]){
        keys_status["back"] = true;
    }
    if (event.code == control_keys["left"]){
        keys_status["left"] = true;
    } 
    if (event.code == control_keys["right"]){
        keys_status["right"] = true;
    } 
}, false);

document.addEventListener("keyup", event => {
    if (event.code == control_keys["down"]){
        keys_status["down"] = false;
    }
    if (event.code == control_keys["up"]){
        keys_status["up"] = false;
    }
    if (event.code == control_keys["forward"]){
        keys_status["forward"] = false;
    } 
    if (event.code == control_keys["back"]){
        keys_status["back"] = false;
    }
    if (event.code == control_keys["left"]){
        keys_status["left"] = false;
    } 
    if (event.code == control_keys["right"]){
        keys_status["right"] = false;
    } 
}, false);


function control(camera){
    var speed = 0.03;
    var x = Math.sin(camera.mouse_angle[0])*speed;
    var y = Math.cos(camera.mouse_angle[0])*speed;

    if (keys_status["down"]){
        camera.pos[1] -= speed;
    }
     if (keys_status["up"]){
        camera.pos[1] += speed;
    }
    if (keys_status["forward"]){
        camera.pos[2] += x;
        camera.pos[0] += y;
    } 
    if (keys_status["back"]){
        camera.pos[2] -= x;
        camera.pos[0] -= y;
    }
    if (keys_status["left"]){
        camera.pos[2] -= y;
        camera.pos[0] += x;
    } 
    if (keys_status["right"]){
        camera.pos[2] += y;
        camera.pos[0] -= x;
    } 
}

setInterval( () => control(camera), 0);

canvas.onclick = function(){
  canvas.requestPointerLock();
}

document.addEventListener('pointerlockchange', lockStatusChange, false);

function lockStatusChange(){
    if(document.pointerLockElement === canvas){
        document.addEventListener("mousemove", updateMouserPosition, false);
    }
    else{
        document.removeEventListener("mousemove", updateMouserPosition, false);
    }
}

function updateMouserPosition(argument) {
    camera.mouse_pos[0] += argument.movementX
    camera.mouse_angle[0] += argument.movementX/500;
    camera.mouse_pos[1] += argument.movementY;
    camera.mouse_angle[1] += argument.movementY/500
}