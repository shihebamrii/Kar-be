const dbConnect = require('../../../../utils/dbConnect');
const User = require('../../../../models/User');
const garageMiddleware = require('../../../../middlewares/garageMiddleware');

export default async function handler(req, res) {
    const { method } = req;

    await dbConnect();

    // Vérifier l'authentification et le rôle garage
    const garage = await garageMiddleware(req, res);
    if (!garage) return;

    switch (method) {
        case 'GET':
            try {
                // Récupérer tous les utilisateurs créés par ce garage
                const users = await User.find({ garageId: garage._id });
                res.status(200).json({ success: true, data: users });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
            break;

        case 'POST':
            try {
                const { username, email, password } = req.body;

                // Créer un nouvel utilisateur lié à ce garage
                const user = await User.create({
                    username,
                    email,
                    password,
                    role: 'user', // Forcer le rôle à 'user'
                    garageId: garage._id
                });

                res.status(201).json({ success: true, data: user });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
            break;

        default:
            res.status(400).json({ success: false });
            break;
    }
}
