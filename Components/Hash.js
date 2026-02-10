// Hash Router Setup
    class HashRouter{
        constructor(routes){
            this.routes = routes;
            this.CurrentPage = null;
            this.isdirty = false;
            this.isActive = true;

            window.addEventListener('hashchange' , (event) => {
                if(this.isdirty && !confirm("数据未保存,确认退出?")){
                    event.preventDefault();
                    history.pushState(null,'',event.oldURL);
                    return;
                }
                this.render();
            });

            window.addEventListener('DOMContentLoaded' , () => this.render());
        }

        getPath(){return location.hash.slice(1) || '/';}
        push(path){location.hash = path;}
        setdirty(flag){this.isdirty = flag;}

        render(){
            let path = this.getPath();
            const handler = this.routes[path] || this.routes['*'];

            handler?.(path);
        }

        destroy(){
            window.removeEventListener('hashchange' , () => this.render());
            window.removeEventListener('DOMContentLoaded' , () => this.render());
            this.isActive = false;
            this.routes.clear();
            return true;
        }
    }

    const RenderPage = (TemplateId,setupFn) => {
        const app = document.getElementById('app');
        
        // 蛋出
        app.style.opacity = '0';
        app.style.transition = 'opacity 0.2s';

        setTimeout(() =>{
            const template = document.getElementById(TemplateId);
            app.innerHTML = '';
            app.appendChild(template.content.cloneNode(true));
            setupFn?.();

            app.style.opacity = '1';
        },200);
     
    }