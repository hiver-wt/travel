const Sequelize = require('sequelize');
// 创建 Sequelize 实例
const sequelize = new Sequelize('travel', 'postgres', '123321', {
    host: 'localhost',
    // 使用 posgres数据库
    dialect: 'postgres',
});
//开启postgis扩展
sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');

//定义景点模型： 
const Attraction = sequelize.define('attraction', {
    name: Sequelize.STRING,
    address: Sequelize.STRING,
    type: Sequelize.STRING,
    point: {
        //坐标系4326
        type: Sequelize.GEOMETRY('POINT', 4326)
    }
});
// 同步模型到数据库中  
Attraction.sync({
    force: false
}).then(async () => {
    console.log('Attraction is synced to database.');
    //获取所有的景点
    let attractions = await Attraction.findAll();
    console.log(attractions.length);
    if (attractions.length === 0) {
        //初始化景点数据
        //读取本地geojson
        const fs = require('fs');
        const path = require('path');
        fs.readFile(path.join(__dirname, 'attractions.json'), 'utf8', (err, data) => {
            if (err) throw err;
            // console.log(data);
            let attractions = JSON.parse(data).features;
            attractions.forEach(async attraction => {
                let { name, address, type } = attraction.properties;
                let coordinates = attraction.geometry.coordinates;

                // 创建带有指定 SRID 的几何点
                await Attraction.create({
                    name,
                    address,
                    type,
                    point: {
                        type: 'Point',
                        coordinates,
                        crs: { type: 'name', properties: { name: 'EPSG:4326' } }
                    }
                });
            });

        });
    }
});
module.exports = {
    Attraction
};