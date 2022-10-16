
const express = require('express')
const app = express()
const port = 3012
const bodyParser = require('body-parser');

const { createClient } = require('@supabase/supabase-js')


require('dotenv').config({path: './.env'});


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/', async function requestHandler(req, res) {

	try{


	const {formattedAmount,paymentPointer, title, url, post_id, monetization} = req.body

	 if(!paymentPointer){
            res.status(405).send({ message: 'Payment pointer is required!' })
            return
        }
	if(!url){
            res.status(405).send({ message: 'Url is required!' })
            return
        }
        if(!post_id){
            res.status(405).send({ message: 'Post id is required!' })
            return
        }
        if(!monetization){
            res.status(405).send({ message: 'Monetization object is required!' })
            return
        }

        if(!formattedAmount){
            res.status(200).send({ message: 'amount is 0' })
            return
        }

	const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET)

	try{
	if(monetization.requestId){

                 const { data:record, err } = await supabase
                .from("wm_posts")
                .select("*")
                .eq("post_id", post_id)
                .eq("wm_session", monetization.requestId.toString())
                ;

console.log(formattedAmount)
                if(!record || !record.length){
                    const { data, error } = await supabase
                    .from('wm_posts')
                    .insert([
                        { slug: url, 
                            session_post:post_id+monetization.requestId,
                            post_id:post_id, 
                            formatted_amount:formattedAmount, 
                            wm_session:monetization.requestId, 
                            wm_data:monetization,
                            payment_pointer:monetization.paymentPointer,
			   currency:monetization.assetCode,
			   title:title
                        },
                    ])
                    if(data){
                        res.status(200).send({ message: 'done' })
                         return
                     }else if(error){
                         console.log(error)
                         return  res.status(500).end('Some error recording the transaction')
                     }

                }else{
                    const total = ((Number(formattedAmount))+ (Number(record[0].formatted_amount)))
                    const newFormattedAmount = (total).toFixed(monetization.assetScale)
                   
                    const { data, error } = await supabase
                    .from('wm_posts')
                    .update({  
                        formatted_amount:newFormattedAmount.toString(), 
                        wm_session:monetization.requestId, 
                        wm_data:monetization,
                        updated_at:((new Date()).toISOString()).toLocaleString(),
			title:title
                    })
                    .eq('id', record[0].id)
                    if(data){
                        return res.status(200).send({ message: 'done' })
                    }else if(error){
                        console.log(error)
                        return  res.status(500).end('Some error recording the transaction')
                    }
                    res.status(200).send({ message: 'done' })
                    return
                }

    
            }else{
                res.status(200).send({ message: 'done' })
                return
            }
	
	}
	catch(e){

	}

	
	}catch(e){
	console.log(e)
	}	
	

});

app.post('/getTotals', async function requestHandler(req, res) {

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET)
const { data, error } = await supabase.rpc('update_totals_and_clear');
console.log(data)
console.log(error)
res.status(200).send({ message: 'done' })
                return

});

app.listen(port, () => {
  console.log(`Web Monetization listener on port ${port}`)
})
