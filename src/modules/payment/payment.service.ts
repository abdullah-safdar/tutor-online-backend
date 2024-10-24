/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';
import configs from '../../config';
import { Product } from 'src/models/product.schema';
import { Price } from 'src/models/price.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AttachPaymentMethodToUserDto,
  CreateSubscriptionDto,
} from './dto/index.dto';
import { User } from 'src/models/user.schema';
import { Subscription } from 'src/models/subscriptions.schema';
import config from '../../config';
import { Invoice } from 'src/models/invoices.schema';
import { Students } from 'src/models/student.schema';
import { Group } from 'src/models/group.schema';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Product.name)
    private ProductModel: Model<Product>,
    @InjectModel(Price.name)
    private PriceModel: Model<Price>,
    @InjectModel(User.name)
    private UserModel: Model<User>,
    @InjectModel(Invoice.name)
    private InvoiceModel: Model<Invoice>,
    @InjectModel(Subscription.name)
    private SubscriptionModel: Model<Subscription>,
    @InjectModel(Students.name)
    private StudentModel: Model<Students>,
    @InjectModel(Group.name)
    private groupModel: Model<Group>,
  ) {
    this.stripe = new Stripe(configs().STRIPE.SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
  }

  async getAllPrices(productId?: string) {
    try {
      const productIdFilter = productId ? { productId } : {};

      const prices = await this.PriceModel.find({
        ...productIdFilter,
      });

      return {
        success: true,
        prices: prices,
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException({ message: error.message, success: false });
    }
  }

  async getAllProducts() {
    try {
      const products = await this.ProductModel.find();

      return {
        success: true,
        products: products,
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException({ message: error.message, success: false });
    }
  }

  async createSetupIntent(uid: string) {
    try {
      let user = await this.UserModel.findById(uid);

      if (!user) {
        user = await this.StudentModel.findById(uid);
      }

      if (!user) {
        throw new NotFoundException({
          success: false,
          message: 'User Not Found!',
        });
      }

      if (!user) {
        throw new NotFoundException({
          success: false,
          message: 'User Not Found',
        });
      }

      const setupIntent = await this.stripe.setupIntents.create({
        customer: user.customerId,
      });

      return {
        client_secret: setupIntent.client_secret,
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException({ message: error.message, success: false });
    }
  }

  async createPaymentMethod(
    body: {
      card: {
        number: string;
        exp_month: number;
        exp_year: number;
        cvc: string;
      };
      billing_details: {
        name: string;
      };
    },
    uid: string,
  ) {
    const { card, billing_details } = body;
    try {
      let user = await this.UserModel.findById(uid);

      if (!user) {
        user = await this.StudentModel.findById(uid);
      }

      if (!user) {
        throw new NotFoundException({
          success: false,
          message: 'User Not Found!',
        });
      }

      const { id } = await this.stripe.paymentMethods.create({
        type: 'card',
        card,
        billing_details,
      });

      await this.stripe.paymentMethods.attach(id, {
        customer: user.customerId,
      });

      return {
        success: true,
        message: 'Payment method attached to custer.',
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException({ message: error.message, success: false });
    }
  }

  async setDefaultPaymentMethod(body: { pId: string }, uid: string) {
    try {
      let user = await this.UserModel.findById(uid);

      if (!user) {
        user = await this.StudentModel.findById(uid);
      }

      if (!user) {
        throw new NotFoundException({
          success: false,
          message: 'User Not Found!',
        });
      }

      const { pId } = body;

      if (!user) {
        throw new NotFoundException({
          success: false,
          message: 'User Not Found!',
        });
      }

      await this.stripe.customers.update(user.customerId, {
        invoice_settings: {
          default_payment_method: pId,
        },
      });

      return {
        success: true,
        message: 'Set default payment method successfully!',
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException({ message: error.message, success: false });
    }
  }

  async removePaymentMethod(body: { pId: string }, uid: string) {
    try {
      let user = await this.UserModel.findById(uid);

      if (!user) {
        user = await this.StudentModel.findById(uid);
      }

      if (!user) {
        throw new NotFoundException({
          success: false,
          message: 'User Not Found!',
        });
      }

      const { pId } = body;

      if (!user) {
        throw new NotFoundException({
          success: false,
          message: 'User Not Found!',
        });
      }

      await this.stripe.paymentMethods.detach(pId);

      return {
        success: true,
        message: 'Payment method removed successfully',
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException({ message: error.message, success: false });
    }
  }

  async startSubscription(body: { sId: string }, uid: string) {
    try {
      let user = await this.UserModel.findById(uid);

      if (!user) {
        user = await this.StudentModel.findById(uid);
      }

      if (!user) {
        throw new NotFoundException({
          success: false,
          message: 'User Not Found!',
        });
      }

      const { sId } = body;

      if (!user) {
        throw new NotFoundException({
          success: false,
          message: 'User Not Found!',
        });
      }

      const subscriptionObj = await this.SubscriptionModel.findOne({
        userId: uid,
        _id: sId,
      });

      if (!subscriptionObj) {
        throw new NotFoundException({
          success: false,
          message: 'Subscription Not Found!',
        });
      }

      const options = {
        customer: user.customerId,
        items: [{ price: subscriptionObj.priceId }],
        metadata: {
          uid: uid,
          studentId: subscriptionObj.student.toString(),
        },
      };

      const subscription = await this.stripe.subscriptions.create(options);

      // store subscriptions info in mongodb
      await this.SubscriptionModel.findByIdAndUpdate(sId, {
        startDate: new Date(),
        status: 'pending',
        subscriptionId: subscription.id,
        userId: uid,
      });

      const price = await this.stripe.prices.retrieve(subscriptionObj.priceId);

      await this.InvoiceModel.create({
        amount: price.unit_amount / 100,
        currency: price.currency,
        invoiceId: subscription.latest_invoice,
        status: 'unpaid',
        userId: uid,
      });

      return {
        success: true,
        message: 'Subscriptions created successfully!',
      };
    } catch (error) {
      console.log(error);

      switch (error.code) {
        case 'resource_missing':
          throw new BadRequestException({
            message: 'Please add a method first.',
            success: false,
          });

        default:
          throw new BadRequestException({
            message: error.message,
            success: false,
          });
      }
    }
  }

  async getUserCards(uid: string) {
    try {
      let user = await this.UserModel.findById(uid);

      if (!user) {
        user = await this.StudentModel.findById(uid);
      }

      if (!user) {
        throw new NotFoundException({
          success: false,
          message: 'User Not Found!',
        });
      }

      if (!user) {
        throw new NotFoundException({
          success: false,
          message: 'User not found!',
        });
      }

      // Retrieve the default payment method for the customer
      const customer = await this.stripe.customers.retrieve(user.customerId);

      const defaultPaymentMethodId =
        // @ts-ignore
        customer.invoice_settings?.default_payment_method;

      // Retrieve the list of payment methods
      const paymentMethods = await this.stripe.customers.listPaymentMethods(
        user.customerId,
        { type: 'card' }, // specifying 'card' to list only card payment methods
      );

      const uniqueCards = [];

      paymentMethods.data.forEach((card) => {
        const isExists = uniqueCards.find((c) => c.last4 === card.card.last4);

        if (!isExists) {
          uniqueCards.push({
            id: card.id,
            exp_year: card.card.exp_year,
            exp_month: card.card.exp_month,
            last4: card.card.last4,
            type: card.card.brand,
            default: card.id === defaultPaymentMethodId, // Mark as default if it matches the default payment method
          });
        }
      });

      return {
        success: true,
        cards: uniqueCards || [],
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(`Get Cards ERROR: ${error.message}`);
    }
  }

  async attachPaymentMethodToUser(
    uid: string,
    body: AttachPaymentMethodToUserDto,
  ) {
    const { setupIntentId } = body;

    try {
      let user = await this.UserModel.findById(uid);

      if (!user) {
        user = await this.StudentModel.findById(uid);
      }

      if (!user) {
        throw new NotFoundException({
          success: false,
          message: 'User Not Found!',
        });
      }

      const setupIntent = await this.stripe.setupIntents.retrieve(
        setupIntentId,
      );

      await this.stripe.customers.update(setupIntent.customer.toString(), {
        invoice_settings: {
          default_payment_method: setupIntent.payment_method.toString(),
        },
      });

      return {
        success: true,
        message: 'Payment method attached to user successfully!',
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException({ success: false, message: error.message });
    }
  }

  async createSubscription(body: CreateSubscriptionDto, uid: string) {
    const { prices, setupIntentId, isAppendToStudent, subjects, yearGroup } =
      body;

    let user = await this.UserModel.findById(uid);

    if (!user) {
      user = await this.StudentModel.findById(uid);
    }

    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User Not Found!',
      });
    }

    try {
      if (setupIntentId) {
        const setupIntent = await this.stripe.setupIntents.retrieve(
          setupIntentId,
        );

        await this.stripe.customers.update(setupIntent.customer.toString(), {
          invoice_settings: {
            default_payment_method: setupIntent.payment_method.toString(),
          },
        });
      }

      for (const price of prices) {
        const _price = await this.stripe.prices.retrieve(price.priceId);

        const product = await this.stripe.products.retrieve(
          _price.product.toString(),
        );

        const options = {
          customer: user.customerId,
          items: [{ price: price.priceId }],
          metadata: {
            uid: uid,
            studentId: price.studentId,
            isAppendToStudent: isAppendToStudent ? 'yes' : 'no',
            subjects: subjects ? JSON.stringify(subjects) : null,
            yearGroup: yearGroup || null,
          },
        };

        const subscription = await this.stripe.subscriptions.create(options);

        // store subscriptions info in mongodb
        await this.SubscriptionModel.create({
          startDate: new Date(),
          // status: subscription.status,
          status: 'pending',
          subscriptionId: subscription.id,
          userId: uid,
          name: product.name,
          amount: _price.unit_amount / 100,
          currency: _price.currency,
          student: price.studentId,
        });

        await this.InvoiceModel.create({
          amount: _price.unit_amount / 100,
          currency: _price.currency,
          invoiceId: subscription.latest_invoice,
          status: 'unpaid',
          userId: uid,
        });
      }

      return {
        success: true,
        message: 'Subscriptions created successfully!',
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException({ message: error.message, success: false });
    }
  }

  async createIncompleteSubscription(
    uid: string,
    prices: { priceId: string; studentId: string }[],
  ) {
    try {
      let user = await this.UserModel.findById(uid);

      if (!user) {
        user = await this.StudentModel.findById(uid);
      }

      if (!user) {
        throw new NotFoundException({
          success: false,
          message: 'User Not Found!',
        });
      }

      for (const price of prices) {
        const _price = await this.stripe.prices.retrieve(price.priceId);

        const product = await this.stripe.products.retrieve(
          _price.product.toString(),
        );

        // const subscription = await this.stripe.subscriptions.create({
        //   customer: user.customerId,
        //   items: [{ price: price.priceId }],
        //   metadata: {
        //     uid: uid,
        //     studentId: price.studentId,
        //   },
        //   payment_behavior: 'default_incomplete',
        //   expand: ['latest_invoice.payment_intent'],
        // });

        // store subscriptions info in mongodb
        await this.SubscriptionModel.create({
          startDate: new Date(),
          status: 'incomplete',
          subscriptionId: null,
          userId: uid,
          name: product.name,
          amount: _price.unit_amount / 100,
          currency: _price.currency,
          priceId: price.priceId,
          student: price.studentId,
        });

        // await this.InvoiceModel.create({
        //   amount: _price.unit_amount / 100,
        //   currency: _price.currency,
        //   // @ts-ignore
        //   invoiceId: subscription.latest_invoice.id,
        //   status: 'unpaid',
        //   userId: uid,
        // });
      }

      return {
        success: true,
        message: 'Subscriptions created successfully!',
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException({
        success: false,
        message: error.message,
      });
    }
  }

  async getUserSubscriptions(uid: string) {
    try {
      let user = await this.UserModel.findById(uid);

      if (!user) {
        user = await this.StudentModel.findById(uid);
      }

      if (!user) {
        throw new NotFoundException({
          success: false,
          message: 'User Not Found!',
        });
      }

      if (!user) {
        throw new NotFoundException({
          success: false,
          message: 'user not found!',
        });
      }

      const subscriptions = await this.SubscriptionModel.find({
        userId: uid,
      }).populate('student');

      return { success: true, subscriptions };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(`${error.message}`);
    }
  }

  async getUserInvoices(uid: string) {
    try {
      let user = await this.UserModel.findById(uid);

      if (!user) {
        user = await this.StudentModel.findById(uid);
      }

      if (!user) {
        throw new NotFoundException({
          success: false,
          message: 'User Not Found!',
        });
      }

      const invoicesDocs = await this.InvoiceModel.find({
        userId: uid,
      });

      console.log('invoicesDocs', invoicesDocs);

      const invoices = await Promise.all(
        invoicesDocs.map(async (_invoice) => {
          const invoice = await this.stripe.invoices.retrieve(
            _invoice.invoiceId,
          );

          return {
            // @ts-ignore
            ..._invoice._doc,
            invoicePdf: invoice.invoice_pdf,
          };
        }),
      );

      return { success: true, invoices };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(`${error.message}`);
    }
  }

  async getUserPaymentInfo(uid: string) {
    try {
      const cardsRes = await this.getUserCards(uid);
      const subscriptionsRes = await this.getUserSubscriptions(uid);
      const invoicesRes = await this.getUserInvoices(uid);

      return {
        success: true,
        info: {
          cards: cardsRes.cards,
          subscriptions: subscriptionsRes.subscriptions,
          invoices: invoicesRes.invoices,
        },
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException({
        success: true,
        message: `Get PaymentInfo ERROR: ${error.message}`,
      });
    }
  }

  async webhook(stripeSignature: string, body: any) {
    try {
      let event: Stripe.Event;
      console.log('webhook triggered');

      try {
        event = this.stripe.webhooks.constructEvent(
          body,
          stripeSignature,
          config().STRIPE.WEBHOOK_SECRET_KEY,
        );
      } catch (error) {
        console.log(error);
        throw new BadRequestException(`Webhook Error: ${error.message}`);
      }

      switch (event.type) {
        case 'invoice.paid':
          const data = event.data.object;

          const { uid, studentId, isAppendToStudent, yearGroup, subjects } =
            data.subscription_details.metadata;

          if (isAppendToStudent === 'yes') {
            const _subjects = JSON.parse(subjects);
            await this.StudentModel.findByIdAndUpdate(studentId, {
              $push: {
                yearGroups: {
                  yearGroup: yearGroup,
                  subjects: _subjects,
                },
              },
            });

            const members = [studentId];

            if (uid !== studentId) {
              members.push(uid);
            }
            await Promise.all(
              _subjects.map(async (subject: string) => {
                const group = await this.groupModel.create({
                  members: members,
                  subject,
                  yearGroup: yearGroup,
                });

                await this.StudentModel.findOneAndUpdate(
                  { _id: studentId },
                  { $addToSet: { groupId: group._id } },
                );

                await this.UserModel.findOneAndUpdate(
                  { _id: uid },

                  { $addToSet: { groupId: group._id } },
                );
              }),
            );
          }

          const subscriptionId = data.subscription;

          // update subscription
          await this.SubscriptionModel.findOneAndUpdate(
            {
              subscriptionId: subscriptionId,
            },
            {
              status: 'active',
            },
          );

          await this.InvoiceModel.findOneAndUpdate(
            {
              invoiceId: data.id,
            },
            {
              status: 'paid',
            },
          );

          // update student
          await this.StudentModel.findByIdAndUpdate(studentId, {
            status: 'active',
          });

          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      return 'success!';
    } catch (error) {
      console.log(error);
      throw new BadRequestException(`Webhook Error: ${error.message}`);
    }
  }
}
