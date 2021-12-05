import gulp from "gulp";
import gpug from "gulp-pug";
import { async } from "regenerator-runtime";
import del from "del";
import ws from "gulp-webserver";
//import image from 'gulp-image';
const sass = require("gulp-sass")(require("node-sass")); // 현재 gulp sass 사용법
import autoprefixer from "gulp-autoprefixer"; // gulp-autoprefixer 작업한 코드를 알아듣지 못하는 구형 브라우저도 호환 가능하도록 해준다.
import minify from "gulp-csso";
import bro from "gulp-bro";
import babelify from "babelify";
import ghPages from "gulp-gh-pages";

// gulp는 task와 함께 동작한다.
// 그래서 우리는 task를 만든다. (minify 코드, 난독화 등등)
// 하나의 Task가 여러가지의 task를 한 번에 할 수 있다.


// 첫번째 예제 Task = 모든 pug파일을 HTML로 바꾸는 task
// - gulp pug 플러그인 설치(pug template을 컴파일 해준다.)
const routes = {
    pug: {
        watch: "src/**/*.pug", // 모든 pug 파일을 지켜본다.
        src: "src/*.pug",
        dest: "build" 
    },
    img: {
        src: "src/img/*",
        dest: "build/img"
    },
    scss: {
        watch: "src/scss/**/*.scss",
        src:"src/scss/style.scss",
        dest: "build"
    },
    js: {
        watch: "src/js/**/*.js",
        src: "src/js/main.js",
        dest: "build/js"
    }
}
// 이걸 다시 build했을 때 생길 수 있는 문제점은 기존에 있는 build랑 충돌될 수 있다.
// 먼저 build 폴더를 clear한 후 build한다. (del 모듈 사용)

// gulp는 pipe랑 쓰인다.
const pug = async () => {
    gulp.src(routes.pug.src)
        .pipe(gpug())
        .pipe(gulp.dest(routes.pug.dest));
}
// build clear
const clean = () => del(["build"]);


// 두번째 예제 Task = 개발 서버를 만든다.
// - gulp webserver 플러그인 설치 
const webserver = () => {
    gulp.src("build")
        .pipe(ws({livereload:true, open:true}));
}

// 네번째 예제 image Optimization = 시간이 오래걸린다. 
// gulp image 플러그인 설치 
// const img = () => {
//     gulp.src(routes.img.src)
//         .pipe(image())
//         .pipe(gulp.dest(routes.img.dest));
// }

// 다섯번째 예제 sass를 css로 변경해준다.
// css를 만들어도 공백하나하나가 byte이기 떄문에 minify를 수행한다. (gulp-csso 사용)
// css 파일을 최소화시킨다. (브라우저에서 더욱 빠르게 만들기위함)
const styles = async () => {
    gulp.src(routes.scss.src)
    .pipe(sass().on("error", sass.logError)) // sass만의 에러 출력
    .pipe(autoprefixer())
    .pipe(minify())
    .pipe(gulp.dest(routes.scss.dest));
}

// Babelify + Browserify
// 브라우저는 import 같은 구문을 이해하지 못하는데 Browserify가 이걸 도와준다.
// 그리고 Browserify안에 Babel을 실행시켜야한다.
// uglifyify = 코드를 압축
// 만약에 react를 작업한다면 presets에 react preset을 넣어주면 된다.
const js = async () => {
    gulp.src(routes.js.src)
    .pipe(bro({
        transform: [
            babelify.configure({ presets: ["@babel/preset-env"] }),
            [ 'uglifyify', { global: true } ]
        ]
    }))
    .pipe(gulp.dest(routes.js.dest));
}

// 배포 gulp-gh-pages
const gh = () => {
    gulp.src("build/**/*")
    .pipe(ghPages());
}

// Task = File watch
// 파일 변경 감지
const watch = () => {
    gulp.watch(routes.pug.watch, pug); // 변경되면 어떤 Task를 수행할 것인지 -> pug
    gulp.watch(routes.scss.watch, styles);
    gulp.watch(routes.js.watch, js);
}

const prepare = gulp.series([clean]);

//const assets = gulp.series([pug, img]);
const assets = gulp.series([pug, styles, js]);

// 두 가지를 병행하려면 parallel을 쓴다.
const live = gulp.parallel([webserver, watch]);

// task들의 series
export const build = gulp.series([assets]);
export const dev = gulp.series([build, live]);
export const deploy = gulp.series([build, gh]);