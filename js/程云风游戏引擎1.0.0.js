/**
 * 简易游戏引擎类，用于管理游戏对象、碰撞检测、事件系统及游戏主循环。
 *
 * @class
 * @param {Object} options - 初始化配置项
 * @param {string} options.container - 游戏容器的选择器
 * @param {number} [options.width=800] - 游戏区域宽度
 * @param {number} [options.height=600] - 游戏区域高度
 *
 * @property {HTMLElement} container - 游戏容器元素
 * @property {number} width - 游戏区域宽度
 * @property {number} height - 游戏区域高度
 * @property {Array<Object>} gameObjects - 游戏对象列表
 * @property {Array} collisionPairs - 碰撞对列表
 * @property {Object} eventListeners - 事件监听器集合
 * @property {number} lastTime - 上一次循环的时间戳
 *
 * @method createGameObject(elementId, options) 创建游戏对象
 * @param {string} elementId - DOM元素ID或类名
 * @param {Object} [options] - 游戏对象配置项
 * @param {number} [options.x=0] - 初始横坐标
 * @param {number} [options.y=0] - 初始纵坐标
 * @param {number} [options.width] - 对象宽度
 * @param {number} [options.height] - 对象高度
 * @param {Object} [options.autoMove] - 自动移动配置
 * @param {boolean} [options.isStatic=false] - 是否为静态物体
 * @param {boolean} [options.isPlayerControlled=false] - 是否为玩家控制
 * @param {boolean} [options.requireGround=false] - 是否需要地面支撑
 * @param {string} [options.tag] - 标签
 * @param {Function} [options.onCollision] - 碰撞回调
 * @returns {Object|null} 返回创建的游戏对象或null
 *
 * @method start() 启动游戏主循环
 *
 * @method update(deltaTime) 更新所有游戏对象状态
 * @param {number} deltaTime - 距离上一次循环的时间间隔（毫秒）
 *
 * @method isOnGround(obj) 检测对象是否在地面上
 * @param {Object} obj - 游戏对象
 * @returns {boolean} 是否在地面上
 *
 * @method checkCollisions() 检查所有游戏对象之间的碰撞
 *
 * @method getCollisionData(obj1, obj2) 获取碰撞数据
 * @param {Object} obj1 - 游戏对象1
 * @param {Object} obj2 - 游戏对象2
 * @returns {Object} 包含重叠量和碰撞方向的数据
 *
 * @method resolveCollision(obj1, obj2, collisionData) 解决碰撞并修正位置
 * @param {Object} obj1 - 游戏对象1
 * @param {Object} obj2 - 游戏对象2
 * @param {Object} collisionData - 碰撞数据
 *
 * @method isColliding(obj1, obj2) 判断两个对象是否发生碰撞
 * @param {Object} obj1 - 游戏对象1
 * @param {Object} obj2 - 游戏对象2
 * @returns {boolean} 是否碰撞
 *
 * @method on(event, callback) 注册事件监听器
 * @param {string} event - 事件名称
 * @param {Function} callback - 回调函数
 *
 * @method emit(event, data) 触发事件
 * @param {string} event - 事件名称
 * @param {*} data - 事件数据
 */
class SimpleGameEngine {
    constructor(options) {
        // 初始化配置
        this.container = document.querySelector(options.container) || document.body;
        this.width = options.width || 800;
        this.height = options.height || 600;
        this.gameObjects = [];
        this.collisionPairs = [];
        this.eventListeners = {};

        // 设置容器样式
        this.container.style.position = 'relative';
        this.container.style.width = `${this.width}px`;
        this.container.style.height = `${this.height}px`;
        this.container.style.overflow = 'hidden';

        // 游戏循环
        this.lastTime = 0;
        this.start();
    }

    // 创建游戏对象
    createGameObject(elementId, options = {}) {
        let element = document.getElementById(elementId) || document.querySelector(`.${elementId}`);
        if (!element) {
            // 没有element则创建一个
            element = document.createElement('div');
            element.id = elementId;
            element.style.backgroundColor = options.backgroundColor || 'red';
            this.container.appendChild(element);
            // console.error(`Element with id ${elementId} not found`);
            // return null;
        }

        // 设置元素基础样式
        element.style.position = 'absolute';
        element.style.left = `${options.x+'px' || element.style.left}`;
        element.style.top = `${options.y+'px'|| element.style.top }`;
        element.style.height = `${options.height+'px'|| element.style.height}`;
        element.style.width = `${options.width+'px' || element.style.width}`;

        const gameObject = {
            id: elementId,
            element,
            x: options.x || 0,
            y: options.y || 0,
            width: options.width || element.offsetWidth,
            height: options.height || element.offsetHeight,
            velocityX: 0, // 初始速度为0
            velocityY: 0,
            autoMove: options.autoMove || null, // 自动移动配置
            isStatic: options.isStatic || false,
            isPlayerControlled: options.isPlayerControlled || false, // 新增玩家控制标志
            requireGround: options.requireGround || false,
            tag: options.tag || '',
            onCollision: options.onCollision || null
        };

        this.gameObjects.push(gameObject);

        // 如果是玩家控制的对象，设置输入监听
        if (gameObject.isPlayerControlled) {
            setTimeout(() => {
                this.emit('playerCreated', gameObject);

            }, 1000)
        }

        return gameObject;
    }



    // 游戏主循环
    start() {
        const gameLoop = (timestamp) => {
            const deltaTime = timestamp - this.lastTime;
            this.lastTime = timestamp;

            this.update(deltaTime);
            this.checkCollisions();

            requestAnimationFrame(gameLoop);
        };

        requestAnimationFrame(gameLoop);
    }

    // 更新所有游戏对象状态
    update(deltaTime) {

        this.gameObjects.forEach(obj => {
            if (!obj.isStatic) {
                // 自动移动逻辑

                if (obj.autoMove) {
                    obj.velocityX = obj.autoMove.x;
                    obj.velocityY = obj.autoMove.y
                }

                // 需要地面支撑的掉落逻辑
                if (obj.requireGround && !this.isOnGround(obj)) {
                    obj.velocityY += 500 * (deltaTime / 500); // 模拟重力加速度
                }

                // 更新位置
                // obj.x += obj.velocityX * (deltaTime / 1000);
                // obj.y += obj.velocityY * (deltaTime / 1000);
                obj.x += obj.velocityX * (deltaTime / 1000);
                obj.y += obj.velocityY * (deltaTime / 1000);

                // 边界检测 - 确保不会移出容器
                // obj.x = Math.max(0, Math.min(this.width - obj.width, obj.x));
                // obj.y = Math.max(0, Math.min(this.height - obj.height, obj.y));


                this.emit('hitBoundary', obj);
                // 如果碰到边界，停止相应方向的移动
                // if (obj.x <= 0 || obj.x >= this.width - obj.width) {
                //     obj.velocityX = 0;
                // }
                // if (obj.y <= 0 || obj.y >= this.height - obj.height) {
                //     obj.velocityY = 0;
                // }

                // 更新DOM元素位置
                obj.element.style.left = `${obj.x}px`;
                obj.element.style.top = `${obj.y}px`;
            }
        });
    }

    // 新增方法：检测是否在地面上
    isOnGround(obj) {
        // 创建一个虚拟的"脚部"检测区域
        const feet = {
            x: obj.x,
            y: obj.y + obj.height + 1, // 脚下1像素的位置
            width: obj.width,
            height: 1
        };

        // 检查是否与任何地面物体碰撞
        return this.gameObjects.some(other => {
            return other !== obj &&
                !other.isPlatform &&
                this.isColliding(feet, other);
        });
    }

    // 修改 checkCollisions 方法
    checkCollisions() {
        for (let i = 0; i < this.gameObjects.length; i++) {
            for (let j = i + 1; j < this.gameObjects.length; j++) {
                const obj1 = this.gameObjects[i];
                const obj2 = this.gameObjects[j];

                if (this.isColliding(obj1, obj2)) {
                    // 计算碰撞深度和方向
                    const collisionData = this.getCollisionData(obj1, obj2);

                    // 修正位置，防止穿透
                    this.resolveCollision(obj1, obj2, collisionData);

                    // 触发碰撞回调
                    if (obj1.onCollision) obj1.onCollision(obj2, collisionData);
                    if (obj2.onCollision) obj2.onCollision(obj1, collisionData);

                    // 触发碰撞事件
                    this.emit('collision', { obj1, obj2, ...collisionData });
                }
            }
        }
    }

    // 新增方法：获取碰撞数据
    getCollisionData(obj1, obj2) {
        // 计算重叠区域
        const overlapX = Math.min(
            obj1.x + obj1.width - obj2.x,
            obj2.x + obj2.width - obj1.x
        );

        const overlapY = Math.min(
            obj1.y + obj1.height - obj2.y,
            obj2.y + obj2.height - obj1.y
        );

        // 确定碰撞方向
        let direction;
        if (overlapX < overlapY) {
            direction = obj1.x < obj2.x ? 'left' : 'right';
        } else {
            direction = obj1.y < obj2.y ? 'top' : 'bottom';
        }

        return {
            overlapX,
            overlapY,
            direction
        };
    }

    // 新增方法：解决碰撞
    resolveCollision(obj1, obj2, { direction, overlapX, overlapY }) {
        // 静态物体不移动
        if (obj1.isStatic && obj2.isStatic) return;

        // 根据碰撞方向修正位置
        if (direction === 'left') {
            if (!obj1.isStatic) obj1.x -= overlapX;
            if (!obj2.isStatic) obj2.x += overlapX;
        } else if (direction === 'right') {
            if (!obj1.isStatic) obj1.x += overlapX;
            if (!obj2.isStatic) obj2.x -= overlapX;
        } else if (direction === 'top') {
            if (!obj1.isStatic) obj1.y -= overlapY;
            if (!obj2.isStatic) obj2.y += overlapY;
        } else if (direction === 'bottom') {
            if (!obj1.isStatic) obj1.y += overlapY;
            if (!obj2.isStatic) obj2.y -= overlapY;
        }

        // 更新DOM元素位置
        obj1.element.style.left = `${obj1.x}px`;
        obj1.element.style.top = `${obj1.y}px`;
        obj2.element.style.left = `${obj2.x}px`;
        obj2.element.style.top = `${obj2.y}px`;

        // 根据碰撞方向停止相应方向的移动
        if (direction === 'left' || direction === 'right') {
            if (!obj1.isStatic) obj1.velocityX = 0;
            if (!obj2.isStatic) obj2.velocityX = 0;
        } else {
            if (!obj1.isStatic) obj1.velocityY = 0;
            if (!obj2.isStatic) obj2.velocityY = 0;
        }
    }

    // AABB碰撞检测（轴对齐边界框）
    isColliding(obj1, obj2) {
        return (
            obj1.x < obj2.x + obj2.width &&
            obj1.x + obj1.width > obj2.x &&
            obj1.y < obj2.y + obj2.height &&
            obj1.y + obj1.height > obj2.y
        );
    }

    // 事件系统
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    emit(event, data) {

        const listeners = this.eventListeners[event];

        if (listeners) {
            listeners.forEach(callback => callback(data));
        }
    }
}