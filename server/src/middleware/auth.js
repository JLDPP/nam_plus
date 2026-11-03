
import jwt from 'jsonwebtoken';

export function auth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ')
        ? header.slice(7)
        : null;

    if (!token) {
        return res.status(401).json({
            message: 'Token requerido'
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET no está configurado');
        return res.status(500).json({
            message: 'Error de configuración del servidor'
        });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = payload.id;
        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Token inválido'
        });
    }
}
