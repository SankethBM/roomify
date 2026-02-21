const PROJECT_PREFIX = 'roomify_project_';

const jsonError = (status, message, extra = {}) => {
    return new Response(JSON.stringify({ error: message, ...extra }), {
        status,
        headers:{
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

const getUserId = async (userPuter) => {
    try{
        const user = await userPuter.auth.getUser();
        return user?.uuid || null;
    }catch (e) {
        return null;
    }
}

router.post('/api/projects/save', async ({ request, user }) => {
    try {
        const userPuter = user.puter;
        if(!userPuter) return jsonError(401, 'Authentication Failed !');

        const body = await request.json();
        const project = body?.project;

        if(!project?.id || !project?.sourceImage) return jsonError(400, 'Project ID and source Image required!');

        const payload = {
            ...project,
            updatedAt: new Date().toISOString(),
        }

        const userId = await getUserId(userPuter);
        if(!userId) return jsonError(401, 'Authentication Failed !');

        const key = `${PROJECT_PREFIX}${project.id}`;
        await userPuter.kv.set(key, payload);

        return { saved: true, id: project.id, project: payload };
    }catch (e){
        return jsonError(500, 'Failed to save Project', { message: e.message || 'Unknown error !'});
    }
})

router.get('/api/projects/list', async ({ user }) => {
    try {
        const userPuter = user.puter;
        if(!userPuter) return jsonError(401, 'Authentication Failed !');

        const userId = await getUserId(userPuter);
        if(!userId) return jsonError(401, 'Authentication Failed !');

        // const keys = await userPuter.kv.keys(PROJECT_PREFIX);
        // const values = await userPuter.kv.get(keys);

        const projects = (await userPuter.kv.list(PROJECT_PREFIX, true))
            .map(({value}) => ({ ...value, isPublic: true }));

        return { projects };
    }catch (e){
        return jsonError(500, 'Failed to list Projects', { message: e.message || 'Unknown error !'});
    }
})

router.get('/api/projects/get', async ({ request, user }) => {
    try {
        const userPuter = user.puter;
        if(!userPuter) return jsonError(401, 'Authentication Failed !');

        const userId = await getUserId(userPuter);
        if(!userId) return jsonError(401, 'Authentication Failed !');

        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if(!id) return jsonError(400, 'Project id is required!');

        const key = `${PROJECT_PREFIX}${id}`;
        const project = await userPuter.kv.get(key);

        return { project };
    }catch (e){
        return jsonError(500, 'Failed to fetch Project', { message: e.message || 'Unknown error !'});
    }
})
