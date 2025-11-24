const dbConnect = require('../../../../utils/dbConnect');
const User = require('../../../../models/User');
const adminMiddleware = require('../../../../middlewares/adminMiddleware');
const { corsHandler } = require('../../../../utils/cors');

export default async function handler(req, res) {
    // Handle CORS preflight and set headers
    if (corsHandler(req, res)) {
        return; // OPTIONS request handled
    }

    const { method } = req;

    await dbConnect();

    // Vérifier l'authentification et le rôle admin
    const admin = await adminMiddleware(req, res);
    if (!admin) return;

    switch (method) {
        case 'GET':
            try {
                // Récupérer tous les utilisateurs avec le rôle 'garage'
                const garages = await User.find({ role: 'garage' });
                res.status(200).json({ success: true, data: garages });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
            break;

        case 'POST':
            try {
                const { username, email, password } = req.body;

                // Créer un nouvel utilisateur avec le rôle 'garage'
                const garage = await User.create({
                    username,
                    email,
                    password,
                    role: 'garage'
                });

                res.status(201).json({ success: true, data: garage });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
            break;

        default:
            res.status(400).json({ success: false });
            break;
    }
}
