const express = require('express');
const axios = require('axios');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const path = require('path');

const app = express();
const port = 3000;

passport.use(new GitHubStrategy({
    clientID: 'Ov23lieCLPddkV8cxP0T',
    clientSecret: 'b4ccc5e0775facd3807d0b5073d89df04712326a',
    callbackURL: 'http://localhost:3000/auth/github/callback'
},
function(accessToken, refreshToken, profile, done) {
    return done(null, { profile, accessToken });
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

app.use(require('express-session')({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/search', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'search.html'));
});

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/menu', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'menu.html'));
});


app.get('/auth/github',
    passport.authenticate('github', { scope: ['repo'] })
);

app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/' }),
    function(req, res) {
        res.redirect('/repos');
    });

app.get('/repos', ensureAuthenticated, async (req, res) => {
    try {
        const response = await axios.get('https://api.github.com/user/repos', {
            headers: { Authorization: `token ${req.user.accessToken}` }
        });
        res.render('repos', { repos: response.data });
    } catch (error) {
        res.status(500).send('Error fetching repositories');
    }
});

app.get('/search', async (req, res) => {
    const searchQuery = req.query.q;
    try {
        const response = await axios.get(`https://api.github.com/search/repositories?q=${searchQuery}`);
        const repos = response.data.items;
        res.render('search-results', { repos });
    } catch (error) {
        res.status(500).send('Error searching repositories');
    }
});


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
