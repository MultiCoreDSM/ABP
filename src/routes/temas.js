import {Router} from 'express';
import{listarTemasService} from '../services/temas.js';

const router = Router();

// HTTP GET http://localhost:3001/api/temas/
router.get('/', async (req, res) => {
    const resposta = await listarTemasService();
    res.send(resposta);
});

export default router;