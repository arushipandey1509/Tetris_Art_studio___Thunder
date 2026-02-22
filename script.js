const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const ROWS = 20;
const COLS = 20;
const SIZE = 30;

let blocks = [];
let history = [];
let redoStack = [];
let currentUser = null;

let preview = null;
let fallingBlock = null;
let gravityInterval = null;

/* ================= TETROMINOES ================= */

const TETROMINOES = {
I:[[1,1,1,1]],
O:[[1,1],[1,1]],
T:[[0,1,0],[1,1,1]],
L:[[1,0],[1,0],[1,1]],
J:[[0,1],[0,1],[1,1]],
S:[[0,1,1],[1,1,0]],
Z:[[1,1,0],[0,1,1]]
};

let currentShape = JSON.parse(JSON.stringify(TETROMINOES.I));

const previewCanvas = document.getElementById("previewCanvas");
const pctx = previewCanvas.getContext("2d");

function register(){
const u = username.value.trim();
const p = password.value.trim();

if(!u || !p){
authMsg.innerText = "Enter username & password";
return;
}

if(localStorage.getItem("user_"+u)){
authMsg.innerText = "User already exists!";
return;
}

localStorage.setItem("user_"+u,p);
authMsg.innerText = "Registered successfully!";
}

function login(){
const u = username.value.trim();
const p = password.value.trim();

if(localStorage.getItem("user_"+u) === p){
currentUser = u;
localStorage.setItem("currentUser",u);
startApp();
}else{
authMsg.innerText = "Invalid credentials!";
}
}

function logout(){
localStorage.removeItem("currentUser");
location.reload();
}

function startApp(){
authContainer.classList.add("hidden");
app.classList.remove("hidden");

handleResumeOption();
draw();
}

/* ================= RESUME OPTION ================= */

function handleResumeOption(){
let last = localStorage.getItem("lastSession_"+currentUser);

if(last){
let choice = confirm("Resume last design?\nOK = Resume\nCancel = New Design");

if(choice){
let data = JSON.parse(last);
blocks = data.blocks || [];
bgPicker.value = data.background || "#111";
if(data.canvasImage){
document.body.style.backgroundImage = `url(${data.canvasImage})`;
document.body.style.backgroundSize = "cover";
}
}else{
blocks = [];
document.body.style.backgroundImage = "";
}
}
}

/* ================= DRAW ================= */

function draw(){
ctx.clearRect(0,0,canvas.width,canvas.height);

ctx.fillStyle = bgPicker.value;
ctx.fillRect(0,0,canvas.width,canvas.height);

for(let r=0;r<ROWS;r++){
for(let c=0;c<COLS;c++){
ctx.strokeStyle="#333";
ctx.strokeRect(c*SIZE,r*SIZE,SIZE,SIZE);
}
}

blocks.forEach(b=>{
drawShape(b.row,b.col,b.shape,b.color);
});

/* SHADOW LANDING */
if(fallingBlock){
let shadowRow = fallingBlock.row;
while(!checkCollision(shadowRow+1,fallingBlock.col,fallingBlock.shape)){
shadowRow++;
}
ctx.save();
ctx.globalAlpha = 0.2;
drawShape(shadowRow,fallingBlock.col,fallingBlock.shape,"white");
ctx.restore();
}

/* BLUR PREVIEW */
if(preview){
ctx.save();
ctx.globalAlpha = 0.3;
ctx.filter = "blur(2px)";
drawShape(preview.row,preview.col,currentShape,colorPicker.value);
ctx.restore();
}

if(fallingBlock){
drawShape(fallingBlock.row,fallingBlock.col,fallingBlock.shape,fallingBlock.color);
}
}

function drawShape(row,col,shape,color){

for(let r=0;r<shape.length;r++){
for(let c=0;c<shape[r].length;c++){

if(shape[r][c]){

let x=(col+c)*SIZE;
let y=(row+r)*SIZE;

/* BASE GRADIENT */
let gradient = ctx.createLinearGradient(x,y,x+SIZE,y+SIZE);
gradient.addColorStop(0,color);
gradient.addColorStop(1,"black");

ctx.fillStyle = gradient;

/* NEON EFFECT */
if(document.body.classList.contains("neon")){
ctx.shadowColor = color;
ctx.shadowBlur = 25;
}else{
ctx.shadowBlur = 0;
}

ctx.fillRect(x,y,SIZE,SIZE);

/* reset shadow so grid doesn’t glow */
ctx.shadowBlur = 0;

}
}
}
}

/* ================= COLLISION ================= */

function checkCollision(row,col,shape){
for(let r=0;r<shape.length;r++){
for(let c=0;c<shape[r].length;c++){
if(shape[r][c]){
let newRow=row+r;
let newCol=col+c;

if(newRow>=ROWS || newCol<0 || newCol>=COLS) return true;

for(let b of blocks){
for(let br=0;br<b.shape.length;br++){
for(let bc=0;bc<b.shape[br].length;bc++){
if(b.shape[br][bc]){
if(newRow===b.row+br && newCol===b.col+bc){
return true;
}
}
}
}
}
}
}
}
return false;
}

/* ================= FREE MODE ================= */

canvas.addEventListener("mousemove",e=>{
if(modeSelect.value!=="free") return;

const rect=canvas.getBoundingClientRect();
const col=Math.floor((e.clientX-rect.left)/SIZE);
const row=Math.floor((e.clientY-rect.top)/SIZE);

if(!checkCollision(row,col,currentShape)){
preview={row,col};
}else{
preview=null;
}
draw();
});

canvas.addEventListener("click",e=>{
if(modeSelect.value==="free"){
if(!preview) return;
saveState();
blocks.push({
row:preview.row,
col:preview.col,
shape:JSON.parse(JSON.stringify(currentShape)),
color:colorPicker.value
});
preview=null;
draw();
}else{
startGravity(e);
}
});

/* ================= GRAVITY ================= */

function startGravity(e){
if(fallingBlock) return;

const rect=canvas.getBoundingClientRect();
const col=Math.floor((e.clientX-rect.left)/SIZE);

fallingBlock={
row:0,
col:col,
shape:JSON.parse(JSON.stringify(currentShape)),
color:colorPicker.value
};

gravityInterval=setInterval(()=>{
if(!checkCollision(fallingBlock.row+1,fallingBlock.col,fallingBlock.shape)){
fallingBlock.row++;
}else{
saveState();
blocks.push(fallingBlock);
fallingBlock=null;
clearInterval(gravityInterval);
}
draw();
},80);
}

/* ================= SAVE STATE ================= */

function saveState(){

history.push(JSON.stringify(blocks));

// limit history size (optional safety)
if(history.length > 50){
history.shift();
}

redoStack = [];

if(currentUser){
localStorage.setItem("lastSession_"+currentUser,JSON.stringify({
blocks:blocks,
background:bgPicker.value,
canvasImage:canvas.toDataURL()
}));
}
}

/* ================= MULTIPLE PROJECTS ================= */

function saveDesign(){
if(!currentUser) return;

let name=prompt("Enter Project Name:");
if(!name) return;

let all=JSON.parse(localStorage.getItem("projects_"+currentUser))||{};
all[name]={
blocks:blocks,
background:bgPicker.value,
canvasImage:canvas.toDataURL()
};

localStorage.setItem("projects_"+currentUser,JSON.stringify(all));
alert("Project Saved!");
}

function loadProject(){
let all=JSON.parse(localStorage.getItem("projects_"+currentUser))||{};
let names=Object.keys(all);

if(names.length===0){
alert("No projects found");
return;
}

let chosen=prompt("Available:\n"+names.join("\n"));
if(!all[chosen]) return;

blocks=all[chosen].blocks;
bgPicker.value=all[chosen].background;
draw();
}

/* ================= APPLY BACKGROUND ================= */

function applyAsBackground(){
const img=canvas.toDataURL();
document.body.style.backgroundImage=`url(${img})`;
document.body.style.backgroundSize="cover";
}

window.onload = ()=>{

populateBlocks();

const savedUser = localStorage.getItem("currentUser");

if(savedUser){
currentUser = savedUser;
startApp();
}else{
draw();
drawPreview();
}

};

function populateBlocks(){

// clear existing options (important if called again)
blockType.innerHTML = "";

// create dropdown options
for(let key in TETROMINOES){
let opt = document.createElement("option");
opt.value = key;
opt.innerText = key;
blockType.appendChild(opt);
}

// set default shape
currentShape = JSON.parse(JSON.stringify(TETROMINOES[blockType.value]));

// when user changes block
blockType.onchange = (e)=>{
currentShape = JSON.parse(JSON.stringify(TETROMINOES[e.target.value]));

// clear preview position (optional clean UX)
preview = null;

// redraw everything
draw();
drawPreview();
};

}

function rotateCurrent(){

let rotated = currentShape[0].map((_,i)=>
currentShape.map(row=>row[i]).reverse()
);

// check collision before applying
if(preview){
if(!checkCollision(preview.row,preview.col,rotated)){
currentShape = rotated;
}
}else{
currentShape = rotated;
}

draw();
drawPreview();
}

function undo(){
if(history.length === 0) return;

redoStack.push(JSON.stringify(blocks));
blocks = JSON.parse(history.pop());
draw();
}

function redo(){
if(redoStack.length === 0) return;

history.push(JSON.stringify(blocks));
blocks = JSON.parse(redoStack.pop());
draw();
}

function resetCanvas(){

// save state before clearing (so undo works)
saveState();

// clear all placed blocks
blocks = [];

// clear preview & falling block
preview = null;
fallingBlock = null;

if(gravityInterval){
clearInterval(gravityInterval);
gravityInterval = null;
}

// clear undo/redo stacks
history = [];
redoStack = [];

// clear background image
document.body.style.backgroundImage = "";

// clear saved session
if(currentUser){
localStorage.removeItem("lastSession_"+currentUser);
}

draw();
}

function toggleNeon(){
document.body.classList.toggle("neon");
draw(); // IMPORTANT → force redraw with glow
drawPreview();
}

function toggleMusic(){

const music = document.getElementById("bgMusic");

if(music.paused){
music.play().then(()=>{
console.log("Music playing");
}).catch(err=>{
console.log("Autoplay blocked:", err);
});
}else{
music.pause();
}

}

function togglePixel(){

document.body.classList.toggle("pixel");

if(document.body.classList.contains("pixel")){
ctx.imageSmoothingEnabled = false;
}else{
ctx.imageSmoothingEnabled = true;
}

draw();
drawPreview();
}

function drawPreview(){

pctx.clearRect(0,0,previewCanvas.width,previewCanvas.height);

let blockSize = 20;

// center shape
let offsetX = (previewCanvas.width - currentShape[0].length * blockSize)/2;
let offsetY = (previewCanvas.height - currentShape.length * blockSize)/2;

for(let r=0;r<currentShape.length;r++){
for(let c=0;c<currentShape[r].length;c++){

if(currentShape[r][c]){

let x = offsetX + c*blockSize;
let y = offsetY + r*blockSize;

/* gradient */
let gradient = pctx.createLinearGradient(x,y,x+blockSize,y+blockSize);
gradient.addColorStop(0,colorPicker.value);
gradient.addColorStop(1,"black");

pctx.fillStyle = gradient;

/* neon support */
if(document.body.classList.contains("neon")){
pctx.shadowColor = colorPicker.value;
pctx.shadowBlur = 20;
}else{
pctx.shadowBlur = 0;
}

pctx.fillRect(x,y,blockSize,blockSize);
pctx.shadowBlur = 0;

}
}
}
}