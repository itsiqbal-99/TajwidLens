import 'reflect-metadata';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {QuizQuestion} from '../src/modules/quiz/quiz.entity';
import {quizTransferSql} from './quiz-transfer-sql';

async function main() {
  const {readConfig} = await import('../src/config/config');
  if (readConfig().production) throw new Error('Export is restricted to development configuration');
  const {default:db} = await import('../src/database/data-source');
  await db.initialize();
  try {
    if(await db.showMigrations()) throw new Error('Apply schema migrations before exporting');
    const rows = await db.getRepository(QuizQuestion).find({order:{id:'ASC'}});
    const directory = resolve(__dirname,'../exports');
    mkdirSync(directory,{recursive:true});
    writeFileSync(resolve(directory,'quiz-development.sql'),quizTransferSql(rows),{encoding:'utf8',mode:0o600});
    console.log(JSON.stringify({file:'exports/quiz-development.sql',versions:rows.length,published:rows.filter(q=>q.reviewStatus==='PUBLISHED').length,suspended:rows.filter(q=>q.suspended).length,personalData:false}));
  } finally {await db.destroy();}
}
main().catch(()=>{console.error('Quiz export failed; check development configuration, migrations and database connectivity. Credentials are not logged.');process.exitCode=1;});
