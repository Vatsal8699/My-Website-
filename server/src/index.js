import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(helmet());
app.use(cors({origin:(process.env.CLIENT_URL||'http://localhost:5173').split(','),credentials:true}));
app.use(express.json({limit:'1mb'}));
app.use(morgan('dev'));
app.use('/api',rateLimit({windowMs:15*60*1000,limit:300,standardHeaders:true,legacyHeaders:false}));

const schema = new mongoose.Schema({
  name:{type:String,required:true,trim:true},email:{type:String,lowercase:true,trim:true,sparse:true},
  passwordHash:String,role:{type:String,enum:['admin','founder','mentor'],default:'founder'},
  title:String,description:String,industry:String,stage:String,status:String,website:String,
  founder:String,mentor:String,startup:String,amount:Number,currency:String,date:Date,
  dueDate:Date,completed:{type:Boolean,default:false},notes:String,score:Number,
  createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'Record'}
},{timestamps:true,strict:false});
const Record=mongoose.model('Record',schema);
const resources=['startups','founders','mentors','milestones','funding','meetings','workshops','evaluations','notifications','investors','team','documents','activity'];
const models=Object.fromEntries(resources.map(n=>[n,mongoose.model(n.charAt(0).toUpperCase()+n.slice(1),schema,n)]));
const auth=(req,res,next)=>{try{const token=(req.headers.authorization||'').replace(/^Bearer /,'');req.user=jwt.verify(token,process.env.JWT_SECRET);next()}catch{return res.status(401).json({message:'Authentication required'})}};
const roles=(...allowed)=>(req,res,next)=>allowed.includes(req.user.role)?next():res.status(403).json({message:'Insufficient permissions'});
const sign=u=>jwt.sign({id:u._id,email:u.email,role:u.role,name:u.name},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'1d'});

app.get('/api/health',(req,res)=>res.json({status:'ok',database:mongoose.connection.readyState===1?'connected':'disconnected'}));
app.post('/api/auth/register',async(req,res)=>{try{const {name,email,password,role='founder'}=req.body;if(!name||!email||!password||password.length<10)return res.status(400).json({message:'Name, email and password (10+ characters) are required'});if(!['founder','mentor'].includes(role))return res.status(403).json({message:'Admin registration is disabled'});if(await Record.findOne({email}))return res.status(409).json({message:'Email already registered'});const u=await Record.create({name,email,passwordHash:await bcrypt.hash(password,12),role});res.status(201).json({token:sign(u),user:{id:u._id,name,email,role}})}catch(e){res.status(400).json({message:e.message})}});
app.post('/api/auth/login',async(req,res)=>{const u=await Record.findOne({email:String(req.body.email||'').toLowerCase()});if(!u?.passwordHash||!await bcrypt.compare(req.body.password||'',u.passwordHash))return res.status(401).json({message:'Invalid email or password'});res.json({token:sign(u),user:{id:u._id,name:u.name,email:u.email,role:u.role}})});
app.get('/api/auth/me',auth,async(req,res)=>{const u=await Record.findById(req.user.id).select('-passwordHash');if(!u)return res.status(404).json({message:'User not found'});res.json({user:u})});

for(const name of resources){
 const Model=models[name];
 app.get('/api/'+name,auth,async(req,res)=>{const page=Math.max(1,Number(req.query.page)||1),limit=Math.min(100,Math.max(1,Number(req.query.limit)||50));const q={};if(req.query.search)q.$or=['name','title','email','industry'].map(k=>({[k]:{$regex:String(req.query.search),$options:'i'}}));if(req.user.role==='founder'&&name==='startups')q.$or=[...(q.$or||[]),{createdBy:req.user.id},{founder:req.user.name}];const [items,total]=await Promise.all([Model.find(q).sort({createdAt:-1}).skip((page-1)*limit).limit(limit).select('-passwordHash'),Model.countDocuments(q)]);res.json({items,total,page,pages:Math.ceil(total/limit)})});
 app.post('/api/'+name,auth,async(req,res)=>{if(req.user.role==='mentor'&&!['evaluations','meetings','notifications'].includes(name))return res.status(403).json({message:'Not permitted'});const item=await Model.create({...req.body,createdBy:req.user.id});res.status(201).json(item)});
 app.get('/api/'+name+'/:id',auth,async(req,res)=>{const item=await Model.findById(req.params.id).select('-passwordHash');if(!item)return res.status(404).json({message:'Not found'});res.json(item)});
 app.patch('/api/'+name+'/:id',auth,async(req,res)=>{if(req.user.role==='mentor'&&!['evaluations','meetings','notifications'].includes(name))return res.status(403).json({message:'Not permitted'});const item=await Model.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true}).select('-passwordHash');if(!item)return res.status(404).json({message:'Not found'});res.json(item)});
 app.delete('/api/'+name+'/:id',auth,roles('admin'),async(req,res)=>{const item=await Model.findByIdAndDelete(req.params.id);if(!item)return res.status(404).json({message:'Not found'});res.json({message:'Deleted'})});
}
app.get('/api/dashboard',auth,async(req,res)=>{const [startups,founders,mentors,milestones,funding,meetings]=await Promise.all(['startups','founders','mentors','milestones','funding','meetings'].map(n=>models[n].countDocuments()));res.json({stats:{startups,founders,mentors,milestones,funding,meetings},recent:await models.startups.find().sort({createdAt:-1}).limit(5)})});
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({message:'Internal server error'})});
const port=process.env.PORT||5000;
mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/venturedesk').then(()=>app.listen(port,()=>console.log('API listening on '+port))).catch(e=>{console.error('MongoDB connection failed:',e.message);process.exit(1)});
