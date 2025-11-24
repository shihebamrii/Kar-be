const authMiddleware = require('./authMiddleware');

/**
 * Middleware pour vérifier que l'utilisateur est un garage
 * Fonctionne avec Next.js API Routes
 * Doit être utilisé après authMiddleware
 */
const garageMiddleware = async (req, res) => {
    try {
        // Appliquer d'abord le middleware d'authentification
        const user = await authMiddleware(req, res);

        if (!user) {
            return null; // La réponse a déjà été envoyée par authMiddleware
        }

        // Vérifier que l'utilisateur est un garage ou un admin (les admins ont souvent accès à tout)
        // Mais ici on veut spécifiquement restreindre aux garages pour leurs propres opérations
        // Si on veut que l'admin puisse aussi agir comme un garage, on peut ajouter || user.role === 'admin'
        if (user.role !== 'garage') {
            res.status(403).json({
                success: false,
                message: 'Accès interdit. Droits garage requis.'
            });
            return null;
        }

        // Retourner l'utilisateur garage
        return user;
    } catch (error) {
        console.error('Garage middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in garage authentication'
        });
        return null;
    }
};

module.exports = garageMiddleware;
